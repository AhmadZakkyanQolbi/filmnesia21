import React from 'react'
import { Helmet } from 'react-helmet-async'

export default function SEO({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type = 'website',
  publishedTime,
  modifiedTime,
  tags = [],
  rating = null,
  year = null,
  genre = null
}) {
  const siteName = 'Filmnesia 21'
  const defaultTitle = 'Filmnesia 21 - Nonton Film & TV Series Gratis Subtitle Indonesia'
  const defaultDescription = 'Nonton streaming film dan TV series gratis dengan subtitle Indonesia. Ribuan film Hollywood, Drakor, Anime, dan Film Indonesia terlengkap.'
  const siteUrl = 'https://filmnesia21.website'
  
  const fullTitle = title ? `${title} - ${siteName}` : defaultTitle
  const fullDescription = description || defaultDescription
  const fullImage = image || `${siteUrl}/og-image.jpg`
  const fullUrl = url || siteUrl
  
  const allKeywords = [
    'nonton film gratis',
    'streaming film indonesia',
    'drakor subtitle indonesia',
    'anime sub indo',
    'film hollywood',
    'filmnesia 21',
    'nonton online gratis',
    ...(keywords ? keywords.split(',') : []),
    ...(genre ? [genre] : []),
    ...(year ? [`film ${year}`] : [])
  ].filter(Boolean).join(', ')

  const movieSchema = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    'name': title,
    'description': fullDescription,
    'datePublished': publishedTime || year,
    'dateModified': modifiedTime || publishedTime,
    'aggregateRating': rating ? {
      '@type': 'AggregateRating',
      'ratingValue': rating,
      'bestRating': '10',
      'ratingCount': '1'
    } : undefined,
    'genre': genre,
    'image': fullImage,
    'url': fullUrl,
    'inLanguage': 'id',
    'countryOfOrigin': {
      '@type': 'Country',
      'name': 'Indonesia'
    }
  }

  const tvSchema = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    'name': title,
    'description': fullDescription,
    'datePublished': publishedTime || year,
    'image': fullImage,
    'url': fullUrl,
    'inLanguage': 'id',
    'countryOfOrigin': {
      '@type': 'Country',
      'name': 'Indonesia'
    }
  }

  const schema = type === 'tv' ? tvSchema : movieSchema

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={allKeywords} />
      <link rel="canonical" href={fullUrl} />
      
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type === 'tv' ? 'video.tv_show' : 'video.movie'} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="id_ID" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />
      
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
      
      {tags.length > 0 && (
        <meta name="article:tag" content={tags.join(', ')} />
      )}
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#0a0a0a" />
    </Helmet>
  )
}