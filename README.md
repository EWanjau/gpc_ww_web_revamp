# GracePoint Church Waiyaki Way website

Mobile-first React/Vite homepage prototype with shared navigation and visitor journeys for Plan a visit and Missional Communities.

## Run locally

```sh
npm install
npm run dev
```

Build the static deployable site with `npm run build`; serve `dist/` from any static host. Run the agreed rendered visitor journeys with `npm run test:journeys` (Playwright and Google Chrome at `/usr/bin/google-chrome` are used in this workspace).

## Framework and WordPress

This starter uses **React + TypeScript + Vite**. Vite emits static HTML, CSS and JavaScript that can be deployed to a static host or served behind WordPress. This keeps page delivery lightweight and makes content connections explicit.

Homepage visitor content is read from WordPress's public REST API. By default `VITE_WORDPRESS_API_URL` is `https://gpcwaiyakiway.org/wp-json/wp/v2`; set that environment variable for another WordPress install. The app requests the public `home`, `contact-us`, and `missional-communities` pages with their published content, plus the `missional-community` custom post type. No authenticated writes or credentials are needed in the browser.

## WordPress content sources

Staff can update these details in the regular WordPress editor. The page parser uses headings and their following paragraph blocks, so keep the headings with their copy when changing the layout:

| Visitor content | WordPress source | Published structure used |
| --- | --- | --- |
| Service hours | **Pages → Home** | Paragraph after the `Our Services` heading, containing a weekday and time range |
| Visit location and directions | **Pages → Contact Us**, then **Home** as fallback | Location text beginning with “At …” or “We are located …”; Home may use the `Visit Us` heading |
| Phone, email, postal address | **Pages → Home** and **Contact Us** | `tel:` and `mailto:` links are preferred; visible phone/email text is also read. Postal address is read from Home text beginning `P.O. Box` |
| About heading, hero introduction, and About copy | **Pages → Home** | `About Us` heading followed by paragraph blocks. The first paragraph also supplies the hero introduction when no excerpt is published |
| Serving description | **Pages → Home** | Paragraphs after `How to Plug in` or `Join Us In Ministry` |
| Missional Community introduction | **Pages → Missional Communities** | First paragraph after the `Missional Communities` heading |
| Community names | **Missional Community** custom post type | Published post titles; the `MC` suffix is omitted in display |
| Community schedules and leaders | **Pages → Missional Communities** | Elementor loop-item cards: the card heading supplies its name; ACF widgets with `data-settings.acf_field_list` of `meeting_day` and `leader` supply the corresponding visible values. Direct CPT ACF values are used where supplied and take precedence when non-empty. |

If a page request fails or the relevant content is unavailable, the app uses the last verified GracePoint visitor details for service time, location, phone, and email. Community meeting and leader details are shown only when WordPress publishes them. If an optional field is absent, its label is omitted. Changes to WordPress content appear on the next page load.

## Content updates

1. Sign into WordPress and open the source page or custom post type shown in the table above.
2. Update the published heading, paragraph, link, or community field and publish.
3. Reload the homepage to see the latest visitor content.
