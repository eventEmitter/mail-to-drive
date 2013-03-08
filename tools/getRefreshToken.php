<?php
require_once 'google-api-php-client/src/Google_Client.php';
require_once 'google-api-php-client/src/contrib/Google_DriveService.php';

$client = new Google_Client();
// Get your credentials from the APIs Console
$client->setClientId('');
$client->setClientSecret('');
$client->setRedirectUri('urn:ietf:wg:oauth:2.0:oob');
$client->setScopes(array('https://www.googleapis.com/auth/drive'));

$service = new Google_DriveService($client);

$authUrl = $client->createAuthUrl();

//Request authorization
print "Please visit:\n$authUrl\n\n";
print "Please enter the auth code:\n";
$authCode = trim(fgets(STDIN));

//print $authCode;
// Exchange authorization code for access token
$accessToken = $client->authenticate($authCode);
$client->setAccessToken($accessToken);

print $accessToken;