Update the sidekick/config.json with the configuration service.

https://www.aem.live/docs/config-service-setup#update-sidekick-configuration

```
// Get the existing config first
curl -X GET https://admin.hlx.page/config/adobecom/sites/da-bacom-blog/sidekick.json \
  -H 'x-auth-token: {your-auth-token}'

// Then post the new config with your changes
curl -X POST https://admin.hlx.page/config/adobecom/sites/da-bacom-blog/sidekick.json \
  -H 'content-type: application/json' \
  -H 'x-auth-token: {your-auth-token}' \
  --data '{
    "plugins": [{
      "id": "foo",
      "title": "Foo",
      "url": "https://www.aem.live/"
    }]
  }'
```
