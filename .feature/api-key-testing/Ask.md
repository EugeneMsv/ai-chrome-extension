# Feature Request

## Feature Name
api-key-testing

## Feature Description
We need to focus only on the background part of the Chrome extension and write as high level as possible integration testing primarily testing the process of API key storage and update. It seems the good way to test would be just run background script as a black box and send the message for saveApiKey and then later checking if it worked by actually calling the chrome storage API and comparing the values. The test should follow Given/When/Then principles as well as trying to be as less boilerplate as possible but not having any hardcoded values, apart from some constants as message name and etc. The test must check simple corner cases. The performance, concurrency, capacity testing are out of scope. Avoid complex file structures. We should not mock uneccessary things. Ideally the background script is built and somehow running and we are just using some way to send message with api key and then checking chrome storage. We should not use directly apiKeyManager or any other custom apis, we should use chrome's way to send messages.