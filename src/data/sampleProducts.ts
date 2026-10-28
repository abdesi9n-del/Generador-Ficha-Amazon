import { ExtractedProduct } from '../types/product';

export const SAMPLE_PRODUCTS: ExtractedProduct[] = [
  {
    id: 'sample-amz-switch',
    url: 'https://www.amazon.com.mx/dp/B098RKWHHZ',
    marketplace: 'Amazon México',
    sku: 'B098RKWHHZ',
    title: 'Nintendo Switch - Modelo OLED con Joy-Con Blanco - Edición Estándar',
    brand: 'Nintendo',
    model: 'HEG-S-KAAAA',
    currentPrice: 5899.00,
    originalPrice: 8999.00,
    currency: 'MXN',
    discountPercent: 34,
    rating: 4.9,
    reviewsCount: 14220,
    availability: 'En stock. Envío gratis a todo México.',
    seller: 'Amazon México',
    condition: 'Nuevo',
    mainImage: 'https://m.media-amazon.com/images/I/61-PblYntsL._AC_SL1500_.jpg',
    images: [
      'https://m.media-amazon.com/images/I/61-PblYntsL._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/71N1jW1vBGL._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/71vL8rXzQJL._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/61k1jU9VvBL._AC_SL1500_.jpg',
    ],
    highlights: [
      'Pantalla OLED de 7 pulgadas con colores intensos y contrastes definidos.',
      'Soporte ancho y ajustable para colocar en modo semiportátil con comodidad.',
      'Puerto LAN por cable integrado en la base para conexión a internet más estable en modo TV.',
      '64 GB de almacenamiento interno, ampliable mediante tarjetas microSD de hasta 2TB.',
      'Audio mejorado en los modos portátil y semiportátil con altavoces estéreo integrados.',
      'Compatible con todos los mandos Joy-Con y el catálogo completo de juegos Nintendo Switch.',
    ],
    description: `Presentamos el miembro más reciente de la familia Nintendo Switch:
• Pantalla OLED de 7 pulgadas con colores intensos y alto contraste.
• Tres modos versátiles: Modo TV para pantalla grande, Modo semiportátil para partidas con amigos y Modo portátil para llevar tus partidas a donde vayas.
• Soporte ajustable amplio para encontrar el ángulo de visión ideal.
• Base con puerto LAN por cable integrado para partidas multijugador estables en línea.
• 64 GB de memoria de almacenamiento interno para descargar tus títulos preferidos.
• Audio mejorado con altavoces estéreo optimizados para juego en modo portátil.`,
    technicalSpecs: [
      { category: 'Pantalla', name: 'Tipo de Pantalla', value: 'OLED multitáctil capacitiva' },
      { category: 'Pantalla', name: 'Tamaño de Pantalla', value: '7.0 pulgadas (17.78 cm)' },
      { category: 'Pantalla', name: 'Resolución Máxima', value: '1280 x 720p (Portátil) / 1920 x 1080p a 60 fps (Modo TV)' },
      { category: 'Rendimiento y Almacenamiento', name: 'Procesador', value: 'NVIDIA Custom Tegra Processor' },
      { category: 'Rendimiento y Almacenamiento', name: 'Almacenamiento Interno', value: '64 GB eMMC' },
      { category: 'Rendimiento y Almacenamiento', name: 'Expansión de Memoria', value: 'Compatible con microSD, microSDHC y microSDXC hasta 2 TB' },
      { category: 'Conectividad', name: 'Conexión Inalámbrica', value: 'Wi-Fi (IEEE 802.11 a/b/g/n/ac) y Bluetooth 4.1' },
      { category: 'Conectividad', name: 'Puertos en la Base', value: '2x USB 2.0, 1x HDMI, 1x Puerto LAN RJ-45 Gigabit, 1x Adaptador CA' },
      { category: 'Batería y Energía', name: 'Batería', value: 'Ion de litio recargable integrada de 4310 mAh' },
      { category: 'Batería y Energía', name: 'Duración Estimada', value: 'Aproximadamente 4.5 a 9 horas' },
      { category: 'Dimensiones y Peso', name: 'Dimensiones con Joy-Con', value: '102 mm x 242 mm x 13.9 mm' },
      { category: 'Dimensiones y Peso', name: 'Peso', value: 'Aproximadamente 420 g con Joy-Con acoplados' },
      { category: 'Audio', name: 'Altavoces', value: 'Altavoces estéreo integrados con audio optimizado' },
      { category: 'Identificadores', name: 'ASIN', value: 'B098RKWHHZ' },
      { category: 'Garantía', name: 'Garantía del Fabricante', value: '1 año de garantía oficial en México' },
    ],
    extractedAt: new Date().toISOString(),
    sourceType: 'auto',
  },
  {
    id: 'sample-amz-kindle',
    url: 'https://www.amazon.com.mx/dp/B09TMN58KL',
    marketplace: 'Amazon México',
    sku: 'B09TMN58KL',
    title: 'Kindle Paperwhite (16 GB) - Ahora con pantalla de 6.8 pulgadas y luz cálida ajustable',
    brand: 'Amazon',
    model: 'Kindle Paperwhite 11.ª Gen',
    currentPrice: 2799.00,
    originalPrice: 3499.00,
    currency: 'MXN',
    discountPercent: 20,
    rating: 4.8,
    reviewsCount: 18450,
    availability: 'En stock. Envío Prime gratis al día siguiente.',
    seller: 'Amazon México',
    condition: 'Nuevo',
    mainImage: 'https://images-na.ssl-images-amazon.com/images/P/B09TMN58KL.01._SCLZZZZZZZ_SX1000_.jpg',
    images: [
      'https://images-na.ssl-images-amazon.com/images/P/B09TMN58KL.01._SCLZZZZZZZ_SX1000_.jpg',
    ],
    highlights: [
      'Pantalla de 6.8 pulgadas con bordes delgados, luz cálida ajustable y hasta 10 semanas de batería.',
      'Diseñado para la lectura con pantalla de 300 ppp antirreflejos que se lee como papel impreso.',
      'Resistente al agua (IPX8) para que leas en la alberca, playa o bañera con total tranquilidad.',
      'Capacidad de 16 GB para almacenar miles de libros, novelas y documentos digitales.',
      'Carga cómoda mediante puerto USB-C universal de alta velocidad.',
    ],
    description: `Disfruta de la mejor experiencia de lectura digital con Kindle Paperwhite:
• Pantalla Paperwhite de 6.8 pulgadas con tecnología E-ink Carta 1200 de 300 ppp.
• Luz cálida ajustable para cambiar el tono de la pantalla de blanco a ámbar cálido.
• Resistencia al agua certificada IPX8 probada contra inmersión accidental.
• Batería de ultra larga duración de hasta 10 semanas con una sola recarga.
• Mayor velocidad de paso de página: hasta un 20% más rápido que generaciones anteriores.
• Conectividad Wi-Fi integrada para descargar libros en cuestión de segundos.`,
    technicalSpecs: [
      { category: 'Pantalla', name: 'Tipo de Pantalla', value: 'Pantalla Paperwhite de 6.8" con tecnología E Ink Carta 1200' },
      { category: 'Pantalla', name: 'Resolución', value: '300 ppp con tecnología de fuentes optimizada y 16 niveles de gris' },
      { category: 'Almacenamiento', name: 'Capacidad de Almacenamiento', value: '16 GB (almacena miles de libros)' },
      { category: 'Batería y Carga', name: 'Autonomía de Batería', value: 'Hasta 10 semanas de lectura con una sola carga' },
      { category: 'Batería y Carga', name: 'Puerto de Carga', value: 'USB-C (cable incluido)' },
      { category: 'Resistencia', name: 'Protección contra Agua', value: 'IPX8 (inmersión hasta 2 metros en agua dulce)' },
      { category: 'Conectividad', name: 'Wi-Fi', value: 'Compatible con redes de 2.4 GHz y 5.0 GHz' },
      { category: 'Dimensiones y Peso', name: 'Dimensiones', value: '174 mm x 125 mm x 8.1 mm' },
      { category: 'Dimensiones y Peso', name: 'Peso', value: '205 gramos' },
      { category: 'Identificadores', name: 'ASIN', value: 'B09TMN58KL' },
      { category: 'Garantía', name: 'Garantía', value: 'Garantía limitada de 1 año de Amazon' },
    ],
    extractedAt: new Date().toISOString(),
    sourceType: 'auto',
  },
  {
    id: 'sample-amz-sony',
    url: 'https://www.amazon.com.mx/dp/B09XS7JWHH',
    marketplace: 'Amazon México',
    sku: 'B09XS7JWHH',
    title: 'Sony WH-1000XM5 Audífonos Inalámbricos con Cancelación de Ruido Líder en la Industria - Negro',
    brand: 'Sony',
    model: 'WH-1000XM5/BM',
    currentPrice: 6499.00,
    originalPrice: 9499.00,
    currency: 'MXN',
    discountPercent: 32,
    rating: 4.7,
    reviewsCount: 8940,
    availability: 'En stock. Envío prioritario gratis.',
    seller: 'Amazon México',
    condition: 'Nuevo',
    mainImage: 'https://m.media-amazon.com/images/I/61+elLnddaL._AC_SL1500_.jpg',
    images: [
      'https://m.media-amazon.com/images/I/61+elLnddaL._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/71p0WfO8QnL._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/61l9X40i1oL._AC_SL1500_.jpg',
    ],
    highlights: [
      'Cancelación de ruido líder del sector con dos procesadores y 8 micrófonos dedicados.',
      'Sonido de alta resolución excepcional con el nuevo diafragma de 30 mm de fibra de carbono.',
      'Llamadas ultranítidas con 4 micrófonos con formación de haces y tecnología de reducción de viento por IA.',
      'Hasta 30 horas de autonomía de batería con cancelación de ruido activada.',
      'Carga ultrarrápida: 3 minutos de carga proporcionan hasta 3 horas de reproducción.',
      'Conexión multipunto que permite emparejar dos dispositivos Bluetooth al mismo tiempo.',
    ],
    description: `Los audífonos WH-1000XM5 de Sony redefinen las reglas para una escucha sin distracciones:
• Dos procesadores dedicados y 8 micrófonos para cancelación activa de ruido inigualable.
• Unidad de diafragma de 30 mm de fibra de carbono para claridad extrema en agudos y graves profundos.
• Llamadas telefónicas con calidad de estudio mediante IA y cancelación de viento.
• Batería de hasta 30 horas con cancelación activa de ruido activada.
• Función de carga ultrarrápida: 3 minutos de carga ofrecen hasta 3 horas de batería.
• Conexión multipunto para enlazar laptop y smartphone simultáneamente.`,
    technicalSpecs: [
      { category: 'Audio', name: 'Unidad de Diafragma', value: '30 mm con cúpula de fibra de carbono' },
      { category: 'Audio', name: 'Respuesta en Frecuencia', value: '4 Hz - 40,000 Hz (Hi-Res Audio Wireless / LDAC)' },
      { category: 'Audio', name: 'Tecnología de Cancelación', value: 'Procesador V1 + Procesador QN1 HD con 8 micrófonos' },
      { category: 'Batería', name: 'Duración con NC', value: 'Hasta 30 horas continuas' },
      { category: 'Batería', name: 'Duración sin NC', value: 'Hasta 40 horas' },
      { category: 'Batería', name: 'Tiempo de Carga', value: 'Aprox. 3.5 horas (Carga rápida: 3 min = 3 horas)' },
      { category: 'Conectividad', name: 'Bluetooth', value: 'Versión 5.2 (Códecs: SBC, AAC, LDAC)' },
      { category: 'Conectividad', name: 'Multipunto', value: 'Sí, conexión simultánea a dos dispositivos' },
      { category: 'Peso y Dimensiones', name: 'Peso', value: 'Aproximadamente 250 g' },
      { category: 'Funciones Inteligentes', name: 'Speak-to-Chat', value: 'Pausa automática al comenzar a hablar' },
      { category: 'Identificadores', name: 'ASIN', value: 'B09XS7JWHH' },
    ],
    extractedAt: new Date().toISOString(),
    sourceType: 'auto',
  },
];
