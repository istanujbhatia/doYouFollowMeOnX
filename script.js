const OAuth = require('oauth-1.0a');
const axios = require('axios');

// Step 1: Set up OAuth credentials
const oauth = OAuth({
  consumer: {
    key: 'your_consumer_key',
    secret: 'your_consumer_secret',
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

// Step 2: Fetch request token
axios.post('https://api.twitter.com/oauth/request_token', {
  oauth_callback: 'your_callback_url', // Replace with your callback URL
}, {
  headers: oauth.toHeader(oauth.authorize({})),
}).then(response => {
  const oauth_token = response.data.oauth_token;
  const oauth_token_secret = response.data.oauth_token_secret;

  // Step 3: Redirect user to authorization URL
  const authorize_url = `https://api.twitter.com/oauth/authorize?oauth_token=${oauth_token}`;
  console.log(`Please go here and authorize: ${authorize_url}`);

  // Step 4: Handle callback and obtain access token
  const verifier = prompt('Paste the verifier code here:');

  axios.post('https://api.twitter.com/oauth/access_token', {
    oauth_verifier: verifier,
  }, {
    headers: oauth.toHeader(oauth.authorize({
      key: oauth_token,
      secret: oauth_token_secret,
      method: 'POST',
      url: 'https://api.twitter.com/oauth/access_token',
      data: { oauth_verifier: verifier },
    })),
  }).then(response => {
    const access_token = response.data.oauth_token;
    const access_token_secret = response.data.oauth_token_secret;

    // Step 5: Use access token to make authenticated requests
    const api_url = 'https://api.twitter.com/1.1/account/verify_credentials.json';
    axios.get(api_url, {
      headers: oauth.toHeader(oauth.authorize({
        key: access_token,
        secret: access_token_secret,
        method: 'GET',
        url: api_url,
      })),
    }).then(response => {
      console.log('User info:', response.data);
    }).catch(error => {
      console.error('Error fetching user info:', error);
    });

  }).catch(error => {
    console.error('Error exchanging request token for access token:', error);
  });

}).catch(error => {
  console.error('Error fetching request token:', error);
});
