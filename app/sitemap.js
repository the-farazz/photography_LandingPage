export default function sitemap() {
  return [
    {
      url: 'https://fsvisuals.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Agar future mein aur pages banayein (jese /portfolio, /contact) toh yahan add karenge
  ]
}
