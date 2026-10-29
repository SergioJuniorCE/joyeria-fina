export type SeedProduct = {
  id: string;
  name: string;
  price: number;
  collection: string;
  imageFile: string;
  featured?: boolean;
};

export const SEED_PRODUCTS: SeedProduct[] = [
  // Recto
  { id: 'p6-1', name: 'Broquel Recto Azul', price: 230, imageFile: 'page_06_img_2.jpg', collection: 'clasicos' },
  { id: 'p6-2', name: 'Broquel Recto Morado', price: 230, imageFile: 'page_06_img_4.jpg', collection: 'clasicos' },
  { id: 'p6-3', name: 'Broquel Recto Rosa', price: 230, imageFile: 'page_06_img_6.jpg', collection: 'clasicos' },

  { id: 'p7-1', name: 'Broquel Recto Mediano Verde', price: 260, imageFile: 'page_07_img_2.jpg', collection: 'clasicos' },
  { id: 'p7-2', name: 'Broquel Recto Mediano Negro', price: 260, imageFile: 'page_07_img_4.jpg', collection: 'clasicos' },
  { id: 'p7-3', name: 'Broquel Recto Mediano Amarillo', price: 260, imageFile: 'page_07_img_6.jpg', collection: 'clasicos' },
  { id: 'p7-4', name: 'Broquel Recto Mediano Tornasol', price: 260, imageFile: 'page_07_img_8.jpg', collection: 'clasicos' },

  { id: 'p8-1', name: 'Broquel Tornasol #1', price: 330, imageFile: 'page_08_img_2.jpg', collection: 'clasicos' },
  { id: 'p8-2', name: 'Broquel Tornasol #2', price: 360, imageFile: 'page_08_img_4.jpg', collection: 'clasicos' },
  { id: 'p8-3', name: 'Broquel Tornasol #3', price: 300, imageFile: 'page_08_img_6.jpg', collection: 'clasicos' },

  { id: 'p9-1', name: 'Broquel Ojos Negro', price: 340, imageFile: 'page_09_img_2.jpg', collection: 'clasicos' },
  { id: 'p9-2', name: 'Broquel Ojos Verde', price: 340, imageFile: 'page_09_img_4.jpg', collection: 'clasicos' },
  { id: 'p9-3', name: 'Broquel Ojos Rosa', price: 340, imageFile: 'page_09_img_6.jpg', collection: 'clasicos' },

  { id: 'p10', name: 'Broquel Cuadrado Resaque', price: 320, imageFile: 'page_10_img_2.jpg', collection: 'clasicos' },
  { id: 'p11', name: 'Broquel Cruz de Piedra', price: 440, imageFile: 'page_11_img_2.jpg', collection: 'clasicos', featured: true },
  { id: 'p12', name: 'Broquel Botón Resaque de Oro', price: 300, imageFile: 'page_12_img_2.jpg', collection: 'clasicos' },
  { id: 'p13', name: 'Broquel Botón Resaque de Oro con Piedra', price: 230, imageFile: 'page_13_img_2.jpg', collection: 'clasicos' },

  // Formas
  { id: 'p14', name: 'Broquel Happy Face Azul de Oro', price: 390, imageFile: 'page_14_img_2.jpg', collection: 'formas' },
  { id: 'p15', name: 'Broquel Hexágono de Oro', price: 340, imageFile: 'page_15_img_2.jpg', collection: 'formas' },
  { id: 'p16', name: 'Broquel Flecha de Oro', price: 240, imageFile: 'page_16_img_2.jpg', collection: 'formas' },
  { id: 'p17', name: 'Broquel Flor Puntitos de Oro', price: 275, imageFile: 'page_17_img_2.jpg', collection: 'formas' },
  { id: 'p18', name: 'Broquel Piña de Oro', price: 330, imageFile: 'page_18_img_2.jpg', collection: 'formas' },
  { id: 'p19', name: 'Broquel Sahuaro de Oro', price: 390, imageFile: 'page_19_img_2.jpg', collection: 'formas' },
  { id: 'p20', name: 'Broquel Silueta de Triángulo de Oro', price: 335, imageFile: 'page_20_img_2.jpg', collection: 'formas' },
  { id: 'p21', name: 'Broquel Triángulo de Oro', price: 340, imageFile: 'page_21_img_2.jpg', collection: 'formas' },

  // Música
  { id: 'p22-1', name: 'Broquel Nota Musical #1', price: 300, imageFile: 'page_22_img_2.jpg', collection: 'musica' },
  { id: 'p22-2', name: 'Broquel Nota Musical #2', price: 300, imageFile: 'page_22_img_4.jpg', collection: 'musica' },
  { id: 'p22-3', name: 'Broquel Nota Musical #3', price: 320, imageFile: 'page_22_img_6.jpg', collection: 'musica' },

  // Corazones
  { id: 'p23', name: 'Broquel Trío Corazón de Oro', price: 360, imageFile: 'page_23_img_2.jpg', collection: 'corazones' },
  { id: 'p24', name: 'Broquel Silueta Trío Corazón de Oro', price: 350, imageFile: 'page_24_img_2.jpg', collection: 'corazones' },
  { id: 'p25', name: 'Broquel Dúo Corazones de Oro', price: 335, imageFile: 'page_25_img_2.jpg', collection: 'corazones' },
  { id: 'p26', name: 'Broquel Corazón de Oro', price: 360, imageFile: 'page_26_img_2.jpg', collection: 'corazones', featured: true },
  { id: 'p27', name: 'Broquel Corazón Resaque con Piedra de Oro', price: 320, imageFile: 'page_27_img_2.jpg', collection: 'corazones' },
  { id: 'p28-1', name: 'Broquel Corazón Piedra Rojo', price: 390, imageFile: 'page_28_img_2.jpg', collection: 'corazones' },
  { id: 'p28-2', name: 'Broquel Corazón Piedra Rosa', price: 390, imageFile: 'page_28_img_4.jpg', collection: 'corazones' },
  { id: 'p28-3', name: 'Broquel Corazón Piedra Morado', price: 390, imageFile: 'page_28_img_6.jpg', collection: 'corazones' },
  { id: 'p28-4', name: 'Broquel Corazón Piedra Blanco', price: 390, imageFile: 'page_28_img_8.jpg', collection: 'corazones' },

  // Estrellas
  { id: 'p29', name: 'Broquel Estrella Fugaz de Oro', price: 385, imageFile: 'page_29_img_2.jpg', collection: 'estrellas', featured: true },
  { id: 'p30', name: 'Broquel Estrella Estampada', price: 300, imageFile: 'page_30_img_2.jpg', collection: 'estrellas' },
  { id: 'p31', name: 'Broquel Trío de Estrellas', price: 380, imageFile: 'page_31_img_2.jpg', collection: 'estrellas' },
  { id: 'p32', name: 'Broquel Estrella de Oro', price: 280, imageFile: 'page_32_img_2.jpg', collection: 'estrellas' },
  { id: 'p33', name: 'Broquel Silueta de Luna', price: 340, imageFile: 'page_33_img_2.jpg', collection: 'estrellas' },
  { id: 'p34', name: 'Broquel Estrella de Resaque de Oro', price: 300, imageFile: 'page_34_img_2.jpg', collection: 'estrellas' },

  // Clásicos
  { id: 'p35', name: 'Broquel Recto de Oro', price: 340, imageFile: 'page_35_img_2.jpg', collection: 'clasicos' },
  { id: 'p36-1', name: 'Broquel Serpiente de Oro #1', price: 390, imageFile: 'page_36_img_2.jpg', collection: 'formas' },
  { id: 'p36-2', name: 'Broquel Serpiente de Oro #2', price: 335, imageFile: 'page_36_img_4.jpg', collection: 'formas' },
  { id: 'p37', name: 'Broquel Figurina Pac-Man', price: 380, imageFile: 'page_37_img_2.jpg', collection: 'formas' },
  { id: 'p38', name: 'Broquel Figurina Jirafa', price: 320, imageFile: 'page_38_img_2.jpg', collection: 'formas' },

  { id: 'p39-1', name: 'Broquel Bolita Oro Rosado #1', price: 330, imageFile: 'page_39_img_2.jpg', collection: 'clasicos' },
  { id: 'p39-2', name: 'Broquel Bolita Oro Rosado #2', price: 350, imageFile: 'page_39_img_4.jpg', collection: 'clasicos' },

  // Letras
  { id: 'p40-1', name: 'Broquel Letra “K” de Oro', price: 350, imageFile: 'page_40_img_2.jpg', collection: 'letras' },
  { id: 'p40-2', name: 'Broquel Letra “A” de Oro', price: 350, imageFile: 'page_40_img_4.jpg', collection: 'letras' },
  { id: 'p40-3', name: 'Broquel Letra “B” de Oro', price: 350, imageFile: 'page_40_img_6.jpg', collection: 'letras' },
  { id: 'p40-4', name: 'Broquel Letra “M” de Oro', price: 350, imageFile: 'page_40_img_8.jpg', collection: 'letras' }
];;

export const SEED_MEDIA = {
  heroFile: 'page_01_img_1.jpg',
  storyFile: 'page_05_img_1.jpg'
};

export const SEED_DESCRIPTIONS: Record<string, string> = {
  clasicos: 'Un clásico en oro de 10 kt con acabado pulido. Una pieza ligera para usar todos los días.',
  corazones: 'Un corazón en oro de 10 kt. Un detalle romántico que no necesita ocasión.',
  estrellas: 'Una estrella en oro de 10 kt. Brillo discreto para acompañarte de día y de noche.',
  formas: 'Un diseño en oro de 10 kt. Una forma singular para sumar carácter al look.',
  musica: 'Una nota musical en oro de 10 kt. Para quien lleva el ritmo en la piel.',
  letras: 'Una letra en oro de 10 kt. Tu inicial, o la de alguien especial.'
};
