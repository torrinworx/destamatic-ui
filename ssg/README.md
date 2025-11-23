# SSG

This ssg system is designed for one thing and one thing only: SEO.

The current goal of the SSG system is focused on seo, not user experience. So things like onClick and other creature comforts like styling aren't included. This is a purely functional system designed to allow you
to build a web app, serve html files for crawlers, then immediately reload the dom with the full single page
web app run by javascript.

Each page will have a link to a js script that is run after the crawlers see the html that will re-load the
dom with the appropriate js and handle redirecting routes.

A routing system for this is still up in the air.
