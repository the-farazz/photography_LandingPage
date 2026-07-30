export default function manifest() {
  return {
    name: "FS Visuals: Cinematic Wedding Photography",

    short_name: "FS Visuals",

    description:
      "FS Visuals captures your wedding, engagement, and Nikkah moments with a luxury cinematic touch in Karachi.",

    start_url: "/",

    scope: "/",

    display: "standalone",

    orientation: "portrait",

    background_color: "#0d0d0d",

    theme_color: "#c9a84c",

    lang: "en-PK",

    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}