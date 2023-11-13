# Contributing to the Passkeys Directory
Thank you for considering contributing to the Passkeys Directory! To ensure a smooth process, please follow the guidelines outlined below.

Contributing to the repository requires some basic knowledge of JSON syntax and how to use Git or GitHub. If you don't possess these skills, you can file a [new issue][issue] where you'll be prompted for the information required for someone else to take over and create the entry.

## Eligibility

The following section contains criteria and explanations regarding what services should be listed in the Passkeys Directory.
A new entry must meet all the criteria to be eligible for listing.

1. The websites have a legitimate reason to require authentication, including limiting access to sensitive information or preventing unauthorized users from performing sensitive actions.
2. A new site must be within the Similarweb top 200,000 global rankings. You can check the ranking of a site [here][similarweb].
3. The website does not serve illegal or [excluded][excluded] content.
4. The website is reachable on the internet and serves content through HTTPS.

## Folder structure

The repository follows a structured organization:
* **entries/**: Data for listed websites.
* **img/**: Icons for entries.
* **scripts/**: [CD][cd] scripts for publishing.
* **tests/**: [CI][ci] scripts for data and icon validation.

## Add entries

### JSON
An "entry" represents a website or service in the Passkeys Directory. Each entry is stored as a JSON file in `entries/` subdirectories.
When creating a new entry, give the file the same name as the domain name. For example, an entry for the website `example.com` should be named `example.com.json` and placed in the folder `entries/e/` as _e_ is the first character of the domain name.

The JSON file should contain one object, and the object key should be the name of the website/service.
As an example, an entry for `youtube.com` would look like the following:
```JSON
{
  "YouTube": {

  }
}
```

#### Additional Domains

If the service is reachable from multiple domain names, you can list those using the `additional-domains` element.
```JSON
{
  "Amazon": {
    "additional-domains": [
      "amazon.ca",
      "amazon.co.uk"
    ]
  }
}
```

#### Regions
If a website is only available in certain countries or most users are located in certain countries - for example, a government site or a local retailer - you can note this with the `regions` element.
```JSON
{
  "Bank of America": {
      "regions": [
          "us"
      ]
  }
}
```
If, on the other hand, the website is available worldwide __except__ for a specific country, the `-`-prefix can be used to exclude a particular region.
```JSON
{
  "Example Site": {
      "regions": [
          "-de"
      ]
  }
}
```

#### Passwordless

If the service supports passwordless authentication using passkeys, use the `passwordless` element.
The `passwordless` element accepts the following values:
* `"allowed"` - Passwordless authentication is possible to use, but it is possible to turn it off.
* `"required"` - Passwordless authentication is enforced for all users with no way of turning it off.

#### MFA

If the service supports passkey authentication as the second factor, i.e., in conjunction with a password or one-time code, use the `mfa` element.
The `mfa` element accepts the following values:
* `"allowed"` - It is possible to enable passkey MFA authentication.
* `"required"` - passkey MFA authentication is always enabled with no way of deactivating it.

#### Contact

If a service doesn't support passkey authentication, use the `contact` element to tell users how to ask the company to support passkeys.
The `contact` element is an object and supports the following values:
* `facebook` - The service's Facebook page handle.
* `twitter` - The service's Twitter/X handle.
* `email` - An email address for the company's support/customer care team.
* `form` - A link to a page where users can fill out a form to contact the company.

```JSON
{
  "Netflix": {
    "contact": {
      "facebook": "netflix",
      "twitter": "Netflixhelps",
      "email": "support@netflix.com"
    }
  }
}
```

### Categories
Linking entries to categories enhances the directory's usability. Each entry should be associated with at least one relevant category.
Below is a table of each available category, the name of the category, and which title it has on the Passkeys Directory with a description.

| Name             |           Title           | Description                                                                         |
|------------------|:-------------------------:|-------------------------------------------------------------------------------------|
| backup           |      Backup and Sync      | Online backup and cross-device file synchronization                                 |
| banking          |          Banking          | Online banking platforms                                                            |
| betting          |          Betting          | Betting and Gambling                                                                |
| cloud            |      Cloud Computing      | "Serverless" cloud computing                                                        |
| communication    |       Communication       | Online communication platforms excluding email and social media                     |
| creativity       |        Creativity         | Art and design software                                                             |
| crowdfunding     |       Crowdfunding        |                                                                                     |
| cryptocurrencies |     Cryptocurrencies      | Any site whose main purpose is handling cryptocurrencies                            |
| developer        |         Developer         | Development software                                                                |
| domains          |          Domains          | DNS Registrars                                                                      |
| education        |         Education         | Non-university education platforms                                                  |
| email            |           Email           | Email providers                                                                     |
| entertainment    |       Entertainment       | Audio/Video entertainment excluding games                                           |
| finance          |          Finance          | Financial, insurance and pension services                                           |
| food             |           Food            | Food and beverage services                                                          |
| gaming           |          Gaming           | Games and game platforms. Sites for buying games should be listed in Retail         |
| government       |        Government         | Government portals. Excluding education                                             |
| health           |          Health           | Health and fitness platforms                                                        |
| hosting          |        Hosting/VPS        | Online website hosting, VPS, and dedicated server rentals                           |
| hotels           | Hotels and Accommodations | Hotels and short term accommodation providers                                       |
| identity         |    Identity Management    | Authentication providers, Single Sign On platforms                                  |
| investing        |         Investing         | Investment platforms                                                                |
| iot              |            IoT            | Internet of Things and device management platforms                                  |
| legal            |           Legal           | Legal aid services                                                                  |
| marketing        |   Marketing & Analytics   | Marketing campaign providers and analytics services                                 |
| payments         |         Payments          | Payment providers                                                                   |
| post             |     Post and Shipping     | Postal and logistics providers                                                      |
| remote           |       Remote Access       | Remote device access platforms                                                      |
| retail           |          Retail           | Online retail platforms                                                             |
| security         |         Security          | Online security and anti-malware services. Excluding VPN and identity management    |
| social           |          Social           | Social networks                                                                     |
| task             |      Task Management      | Task management and to-do services                                                  |
| tickets          |    Tickets and Events     | Ticketing and event platforms                                                       |
| transport        |         Transport         | Transportation services including public transport and airlines                     |
| universities     |       Universities        | University online platforms                                                         |
| utilities        |         Utilities         | Household utilities including electricity, gas, water, phone and internet providers |
| vpn              |       VPN Providers       |                                                                                     |
| other            |           Other           | Sites that don't fit in any other category                                          |

If you only link one category to the entry, use a string:
```JSON
{
  "Coinbase": {
    "categories": "cryptocurrencies"
  }
}

```
If linking to more than one, add each category in an array.
```json
{
  "Morgan Stanley": {
    "categories": [
      "investing",
      "banking"
    ]
  }
}
```

### Icons

Icons enhance brand recognition and contribute to a cohesive user experience within the Passkeys Directory. When adding a new entry, including an icon is mandatory.

Icons should be placed in `img/` subdirectories and named after the entry's domain. For instance, the icon for `youtube.com` should be in `img/y/` and named `youtube.com.svg` or `youtube.com.png`.

SVG format is preferred due to its smaller size and compatibility with various resolutions. If you don't have an SVG icon, a PNG is acceptable with resolutions of 32x32, 64x64, or 128x128. For SVG icons, consider optimizing them using tools like [SVGOMG][svgomg] to reduce the file size.

If you can't find an SVG icon, PNG images should be optimized using [TinyPNG][tinypng].

> **TL;DR**
> - Ensure the icon corresponds to the entry's domain.
> - Optimize SVG icons for reduced file size using [SVGOMG][svgomg].
> - For PNG images, use resolutions of 32x32, 64x64, or 128x128. Optimize them with [TinyPNG][tinypng].

## Footer
Thank you for contributing to the Passkeys Directory! Should you have any questions or need assistance, feel free to [reach out][issue]. Happy contributing!

[ci]: https://en.wikipedia.org/wiki/Continuous_integration
[cd]: https://en.wikipedia.org/wiki/Continuous_deployment
[excluded]: /EXCLUDED.md
[similarweb]: https://www.similarweb.com/
[svgomg]: https://jakearchibald.github.io/svgomg/
[tinypng]: https://tinypng.com/
[issue]: https://github.com/2factorauth/passkeys/issues/new/choose
