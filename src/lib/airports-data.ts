// Base de datos de aeropuertos internacionales
// Incluye los principales aeropuertos de México y destinos turísticos populares

export interface Airport {
  iata: string
  name: string
  city: string
  country: string
  countryCode: string
  type: 'international' | 'domestic'
  state?: string
}

export const AIRPORTS: Airport[] = [
  // MÉXICO - Principales
  { iata: 'MEX', name: 'Aeropuerto Internacional Benito Juárez', city: 'Ciudad de México', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'CUN', name: 'Aeropuerto Internacional de Cancún', city: 'Cancún', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'GDL', name: 'Aeropuerto Internacional Miguel Hidalgo', city: 'Guadalajara', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'MTY', name: 'Aeropuerto Internacional Mariano Escobedo', city: 'Monterrey', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'TIJ', name: 'Aeropuerto Internacional General Abelardo L. Rodríguez', city: 'Tijuana', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'PVR', name: 'Aeropuerto Internacional Lic. Gustavo Díaz Ordaz', city: 'Puerto Vallarta', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'SJD', name: 'Aeropuerto Internacional de Los Cabos', city: 'Los Cabos', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'MZT', name: 'Aeropuerto Internacional General Rafael Buelna', city: 'Mazatlán', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'HUX', name: 'Aeropuerto Internacional de Huatulco', city: 'Huatulco', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'ZIH', name: 'Aeropuerto Internacional de Ixtapa-Zihuatanejo', city: 'Ixtapa', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'ACA', name: 'Aeropuerto Internacional General Juan N. Álvarez', city: 'Acapulco', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'MID', name: 'Aeropuerto Internacional Manuel Crescencio Rejón', city: 'Mérida', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'OAX', name: 'Aeropuerto Internacional Xoxocotlán', city: 'Oaxaca', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'VER', name: 'Aeropuerto Internacional General Heriberto Jara', city: 'Veracruz', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'TAM', name: 'Aeropuerto Internacional General Francisco Javier Mina', city: 'Tampico', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'BJX', name: 'Aeropuerto Internacional del Bajío', city: 'León', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'QRO', name: 'Aeropuerto Internacional de Querétaro', city: 'Querétaro', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'AGU', name: 'Aeropuerto Internacional Lic. Jesús Terán Peredo', city: 'Aguascalientes', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'CUU', name: 'Aeropuerto Internacional General Roberto Fierro Villalobos', city: 'Chihuahua', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'HMO', name: 'Aeropuerto Internacional General Ignacio Pesqueira García', city: 'Hermosillo', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'CUL', name: 'Aeropuerto Internacional Federal de Culiacán', city: 'Culiacán', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'REX', name: 'Aeropuerto Internacional General Lucio Blanco', city: 'Reynosa', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'TRC', name: 'Aeropuerto Internacional Francisco Sarabia', city: 'Torreón', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'MLM', name: 'Aeropuerto Internacional General Francisco J. Mujica', city: 'Morelia', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'CME', name: 'Aeropuerto Internacional de Ciudad del Carmen', city: 'Ciudad del Carmen', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'VSA', name: 'Aeropuerto Internacional Carlos Rovirosa Pérez', city: 'Villahermosa', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'TGZ', name: 'Aeropuerto Internacional Ángel Albino Corzo', city: 'Tuxtla Gutiérrez', country: 'México', countryCode: 'MX', type: 'international' },
  { iata: 'CZM', name: 'Aeropuerto Internacional de Cozumel', city: 'Cozumel', country: 'México', countryCode: 'MX', type: 'international' },

  // ESTADOS UNIDOS - Principales
  { iata: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'SAN', name: 'San Diego International Airport', city: 'San Diego', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'OAK', name: 'Oakland International Airport', city: 'Oakland', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'SJC', name: 'San José Mineta International Airport', city: 'San José', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'SMF', name: 'Sacramento International Airport', city: 'Sacramento', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'BUR', name: 'Hollywood Burbank Airport', city: 'Burbank', country: 'Estados Unidos', countryCode: 'US', type: 'domestic' },
  { iata: 'LGB', name: 'Long Beach Airport', city: 'Long Beach', country: 'Estados Unidos', countryCode: 'US', type: 'domestic' },
  { iata: 'PSP', name: 'Palm Springs International Airport', city: 'Palm Springs', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'SNA', name: 'John Wayne Airport', city: 'Orange County', country: 'Estados Unidos', countryCode: 'US', type: 'domestic' },
  { iata: 'FAT', name: 'Fresno Yosemite International Airport', city: 'Fresno', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'SBA', name: 'Santa Barbara Municipal Airport', city: 'Santa Barbara', country: 'Estados Unidos', countryCode: 'US', type: 'domestic' },
  { iata: 'RNO', name: 'Reno-Tahoe International Airport', city: 'Reno', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'PDX', name: 'Portland International Airport', city: 'Portland', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'EUG', name: 'Eugene Airport', city: 'Eugene', country: 'Estados Unidos', countryCode: 'US', type: 'domestic' },
  { iata: 'MFR', name: 'Rogue Valley International–Medford Airport', city: 'Medford', country: 'Estados Unidos', countryCode: 'US', type: 'domestic' },
  { iata: 'RDM', name: 'Redmond Municipal Airport', city: 'Redmond', country: 'Estados Unidos', countryCode: 'US', type: 'domestic' },
  { iata: 'HOU', name: 'William P. Hobby Airport', city: 'Houston', country: 'Estados Unidos', countryCode: 'US', type: 'domestic' },
  { iata: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'Estados Unidos', countryCode: 'US', type: 'domestic' },
  { iata: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'FLL', name: 'Fort Lauderdale-Hollywood International Airport', city: 'Fort Lauderdale', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'TPA', name: 'Tampa International Airport', city: 'Tampa', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'MCO', name: 'Orlando International Airport', city: 'Orlando', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'AUS', name: 'Austin-Bergstrom International Airport', city: 'Austin', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'SAT', name: 'San Antonio International Airport', city: 'San Antonio', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'ELP', name: 'El Paso International Airport', city: 'El Paso', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'MSP', name: 'Minneapolis–Saint Paul International Airport', city: 'Minneapolis', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'SLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'CLT', name: 'Charlotte Douglas International Airport', city: 'Charlotte', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'BOS', name: 'Logan International Airport', city: 'Boston', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'BWI', name: 'Baltimore/Washington International Thurgood Marshall Airport', city: 'Baltimore', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington D.C.', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'DTW', name: 'Detroit Metropolitan Wayne County Airport', city: 'Detroit', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'CLE', name: 'Cleveland Hopkins International Airport', city: 'Cleveland', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'CMH', name: 'John Glenn Columbus International Airport', city: 'Columbus', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'PIT', name: 'Pittsburgh International Airport', city: 'Pittsburgh', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'STL', name: 'St. Louis Lambert International Airport', city: 'St. Louis', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'MCI', name: 'Kansas City International Airport', city: 'Kansas City', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'BNA', name: 'Nashville International Airport', city: 'Nashville', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'MEM', name: 'Memphis International Airport', city: 'Memphis', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'MSY', name: 'Louis Armstrong New Orleans International Airport', city: 'New Orleans', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'RDU', name: 'Raleigh-Durham International Airport', city: 'Raleigh', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'JAX', name: 'Jacksonville International Airport', city: 'Jacksonville', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'RSW', name: 'Southwest Florida International Airport', city: 'Fort Myers', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'HNL', name: 'Daniel K. Inouye International Airport', city: 'Honolulu', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'OGG', name: 'Kahului Airport', city: 'Kahului', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'KOA', name: 'Ellison Onizuka Kona International Airport', city: 'Kona', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'ANC', name: 'Ted Stevens Anchorage International Airport', city: 'Anchorage', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'FAI', name: 'Fairbanks International Airport', city: 'Fairbanks', country: 'Estados Unidos', countryCode: 'US', type: 'domestic' },
  { iata: 'ABQ', name: 'Albuquerque International Sunport', city: 'Albuquerque', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'OKC', name: 'Will Rogers World Airport', city: 'Oklahoma City', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'OMA', name: 'Eppley Airfield', city: 'Omaha', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'BOI', name: 'Boise Airport', city: 'Boise', country: 'Estados Unidos', countryCode: 'US', type: 'domestic' },
  { iata: 'TUS', name: 'Tucson International Airport', city: 'Tucson', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'PBI', name: 'Palm Beach International Airport', city: 'West Palm Beach', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'ONT', name: 'Ontario International Airport', city: 'Ontario', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'IND', name: 'Indianapolis International Airport', city: 'Indianápolis', country: 'Estados Unidos', countryCode: 'US', type: 'international' },
  { iata: 'GEG', name: 'Spokane International Airport', city: 'Spokane', country: 'Estados Unidos', countryCode: 'US', type: 'international' },

  // CARIBE
  { iata: 'PUJ', name: 'Punta Cana International Airport', city: 'Punta Cana', country: 'República Dominicana', countryCode: 'DO', type: 'international' },
  { iata: 'SDQ', name: 'Las Américas International Airport', city: 'Santo Domingo', country: 'República Dominicana', countryCode: 'DO', type: 'international' },

  // CUBA - Todos los aeropuertos internacionales
  { iata: 'HAV', name: 'Aeropuerto Internacional José Martí', city: 'La Habana', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'HAV1', name: 'Terminal 1 - Vuelos Nacionales José Martí', city: 'La Habana', country: 'Cuba', countryCode: 'CU', type: 'domestic' },
  { iata: 'HAV2', name: 'Terminal 2 - Vuelos Internacionales EEUU José Martí', city: 'La Habana', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'VRA', name: 'Aeropuerto Internacional Juan Gualberto Gómez', city: 'Varadero', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'HOG', name: 'Aeropuerto Internacional Frank País', city: 'Holguín', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'SCU', name: 'Aeropuerto Internacional Antonio Maceo', city: 'Santiago de Cuba', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'CYO', name: 'Aeropuerto Internacional Vilo Acuña', city: 'Cayo Largo del Sur', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'CMW', name: 'Aeropuerto Internacional Ignacio Agramonte', city: 'Camagüey', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'SNU', name: 'Aeropuerto Internacional Abel Santamaría', city: 'Santa Clara', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'CFG', name: 'Aeropuerto Internacional Jaime González', city: 'Cienfuegos', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'CCC', name: 'Aeropuerto Internacional Jardines del Rey', city: 'Cayo Coco', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'MZO', name: 'Aeropuerto Internacional Sierra Maestra', city: 'Manzanillo', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'GAO', name: 'Aeropuerto Internacional Mariana Grajales', city: 'Guantánamo', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'BCA', name: 'Aeropuerto Internacional Gustavo Rizo', city: 'Baracoa', country: 'Cuba', countryCode: 'CU', type: 'international' },
  { iata: 'AVI', name: 'Aeropuerto Internacional Máximo Gómez', city: 'Ciego de Ávila', country: 'Cuba', countryCode: 'CU', type: 'international' },

  { iata: 'MBJ', name: 'Sangster International Airport', city: 'Montego Bay', country: 'Jamaica', countryCode: 'JM', type: 'international' },
  { iata: 'KIN', name: 'Norman Manley International Airport', city: 'Kingston', country: 'Jamaica', countryCode: 'JM', type: 'international' },
  { iata: 'AUA', name: 'Queen Beatrix International Airport', city: 'Oranjestad', country: 'Aruba', countryCode: 'AW', type: 'international' },
  { iata: 'CUR', name: 'Hato International Airport', city: 'Willemstad', country: 'Curazao', countryCode: 'CW', type: 'international' },
  { iata: 'SXM', name: 'Princess Juliana International Airport', city: 'Philipsburg', country: 'Sint Maarten', countryCode: 'SX', type: 'international' },

  // GUAYANA FRANCESA
  { iata: 'CAY', name: 'Cayenne – Félix Eboué Airport', city: 'Cayena', country: 'Guayana Francesa', countryCode: 'GF', type: 'international' },
  { iata: 'DEG', name: 'Grand-Santi Airport', city: 'Grand-Santi', country: 'Guayana Francesa', countryCode: 'GF', type: 'domestic' },
  { iata: 'LSS', name: 'Les Saintes Airport', city: 'Terre-de-Bas Island', country: 'Guayana Francesa', countryCode: 'GF', type: 'domestic' },
  { iata: 'MNR', name: 'Maripasoula Airport', city: 'Maripasoula', country: 'Guayana Francesa', countryCode: 'GF', type: 'domestic' },
  { iata: 'OXP', name: 'Saint-Laurent-du-Maroni Airport', city: 'Saint-Laurent-du-Maroni', country: 'Guayana Francesa', countryCode: 'GF', type: 'domestic' },
  { iata: 'REI', name: 'Regina Airport', city: 'Régina', country: 'Guayana Francesa', countryCode: 'GF', type: 'domestic' },
  { iata: 'SWM', name: 'Saul Airport', city: 'Saul', country: 'Guayana Francesa', countryCode: 'GF', type: 'domestic' },

  { iata: 'GEO', name: 'Cheddi Jagan International Airport', city: 'Georgetown', country: 'Guyana', countryCode: 'GY', type: 'international' },
  { iata: 'OGL', name: 'Eugene F. Correia International Airport', city: 'Georgetown', country: 'Guyana', countryCode: 'GY', type: 'international' },
  { iata: 'LTM', name: 'Lethem Airport', city: 'Lethem', country: 'Guyana', countryCode: 'GY', type: 'domestic' },
  { iata: 'PBM', name: 'Johan Adolf Pengel International Airport', city: 'Paramaribo', country: 'Surinam', countryCode: 'SR', type: 'international' },
  { iata: 'ORG', name: 'Zorg en Hoop Airport', city: 'Paramaribo', country: 'Surinam', countryCode: 'SR', type: 'domestic' },
  { iata: 'ABN', name: 'Albina Airport', city: 'Albina', country: 'Surinam', countryCode: 'SR', type: 'domestic' },

  // CENTROAMÉRICA
  { iata: 'SAL', name: 'Monseñor Óscar Arnulfo Romero International Airport', city: 'San Salvador', country: 'El Salvador', countryCode: 'SV', type: 'international' },
  { iata: 'GUA', name: 'La Aurora International Airport', city: 'Ciudad de Guatemala', country: 'Guatemala', countryCode: 'GT', type: 'international' },
  { iata: 'SJO', name: 'Juan Santamaría International Airport', city: 'San José', country: 'Costa Rica', countryCode: 'CR', type: 'international' },
  { iata: 'LIR', name: 'Daniel Oduber Quirós International Airport', city: 'Liberia', country: 'Costa Rica', countryCode: 'CR', type: 'international' },
  { iata: 'PTY', name: 'Tocumen International Airport', city: 'Ciudad de Panamá', country: 'Panamá', countryCode: 'PA', type: 'international' },
  { iata: 'PAC', name: 'Marcos A. Gelabert International Airport', city: 'Ciudad de Panamá', country: 'Panamá', countryCode: 'PA', type: 'international' },
  { iata: 'DAV', name: 'Enrique Malek International Airport', city: 'David', country: 'Panamá', countryCode: 'PA', type: 'international' },
  { iata: 'RIH', name: 'Scarlett Martínez International Airport', city: 'Río Hato', country: 'Panamá', countryCode: 'PA', type: 'international' },
  { iata: 'ONX', name: 'Enrique Adolfo Jiménez Airport', city: 'Colón', country: 'Panamá', countryCode: 'PA', type: 'international' },
  { iata: 'BOC', name: 'Bocas del Toro “Isla Colón” International Airport', city: 'Bocas del Toro', country: 'Panamá', countryCode: 'PA', type: 'international' },
  { iata: 'MGA', name: 'Augusto C. Sandino International Airport', city: 'Managua', country: 'Nicaragua', countryCode: 'NI', type: 'international' },
  { iata: 'BEF', name: 'Bluefields Airport', city: 'Bluefields', country: 'Nicaragua', countryCode: 'NI', type: 'domestic' },
  { iata: 'RNI', name: 'Corn Island Airport', city: 'Corn Island', country: 'Nicaragua', countryCode: 'NI', type: 'domestic' },
  { iata: 'PUZ', name: 'Puerto Cabezas Airport', city: 'Puerto Cabezas', country: 'Nicaragua', countryCode: 'NI', type: 'domestic' },
  { iata: 'TGU', name: 'Toncontín International Airport', city: 'Tegucigalpa', country: 'Honduras', countryCode: 'HN', type: 'international' },
  { iata: 'SAP', name: 'Ramón Villeda Morales International Airport', city: 'San Pedro Sula', country: 'Honduras', countryCode: 'HN', type: 'international' },
  { iata: 'BZE', name: 'Philip S. W. Goldson International Airport', city: 'Belize City', country: 'Belice', countryCode: 'BZ', type: 'international' },

  // SUDAMÉRICA - Principales
  { iata: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombia', countryCode: 'CO', type: 'international' },
  { iata: 'CTG', name: 'Rafael Núñez International Airport', city: 'Cartagena', country: 'Colombia', countryCode: 'CO', type: 'international' },
  { iata: 'MDE', name: 'José María Córdova International Airport', city: 'Medellín', country: 'Colombia', countryCode: 'CO', type: 'international' },
  { iata: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Perú', countryCode: 'PE', type: 'international' },
  { iata: 'CUZ', name: 'Alejandro Velasco Astete International Airport', city: 'Cusco', country: 'Perú', countryCode: 'PE', type: 'international' },
  { iata: 'GRU', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'Brasil', countryCode: 'BR', type: 'international' },
  { iata: 'GIG', name: 'Rio de Janeiro/Galeão International Airport', city: 'Río de Janeiro', country: 'Brasil', countryCode: 'BR', type: 'international' },
  { iata: 'EZE', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', type: 'international' },
  { iata: 'SCL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile', countryCode: 'CL', type: 'international' },
  { iata: 'UIO', name: 'Mariscal Sucre International Airport', city: 'Quito', country: 'Ecuador', countryCode: 'EC', type: 'international' },
  { iata: 'GYE', name: 'José Joaquín de Olmedo International Airport', city: 'Guayaquil', country: 'Ecuador', countryCode: 'EC', type: 'international' },

  // EUROPA - Principales
  { iata: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'España', countryCode: 'ES', type: 'international' },
  { iata: 'BCN', name: 'Barcelona-El Prat Airport', city: 'Barcelona', country: 'España', countryCode: 'ES', type: 'international' },
  { iata: 'CDG', name: 'Charles de Gaulle Airport', city: 'París', country: 'Francia', countryCode: 'FR', type: 'international' },
  { iata: 'LHR', name: 'Heathrow Airport', city: 'Londres', country: 'Reino Unido', countryCode: 'GB', type: 'international' },
  { iata: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport', city: 'Roma', country: 'Italia', countryCode: 'IT', type: 'international' },
  { iata: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Ámsterdam', country: 'Países Bajos', countryCode: 'NL', type: 'international' },
  { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Alemania', countryCode: 'DE', type: 'international' },
  { iata: 'MUC', name: 'Munich Airport', city: 'Múnich', country: 'Alemania', countryCode: 'DE', type: 'international' },
  { iata: 'LIS', name: 'Lisbon Portela Airport', city: 'Lisboa', country: 'Portugal', countryCode: 'PT', type: 'international' },
  { iata: 'ZRH', name: 'Zurich Airport', city: 'Zúrich', country: 'Suiza', countryCode: 'CH', type: 'international' },

  // ASIA - Principales destinos turísticos
  { iata: 'NRT', name: 'Narita International Airport', city: 'Tokio', country: 'Japón', countryCode: 'JP', type: 'international' },
  { iata: 'ICN', name: 'Incheon International Airport', city: 'Seúl', country: 'Corea del Sur', countryCode: 'KR', type: 'international' },
  { iata: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Tailandia', countryCode: 'TH', type: 'international' },
  { iata: 'SIN', name: 'Singapore Changi Airport', city: 'Singapur', country: 'Singapur', countryCode: 'SG', type: 'international' },
  { iata: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', type: 'international' },
  { iata: 'DXB', name: 'Dubai International Airport', city: 'Dubái', country: 'Emiratos Árabes Unidos', countryCode: 'AE', type: 'international' },
]

export const AIRPORT_STATE_MAP: Record<string, string> = {
  // Estados Unidos - California
  LAX: 'California', SFO: 'California', SAN: 'California', OAK: 'California', SJC: 'California', SMF: 'California',
  BUR: 'California', LGB: 'California', PSP: 'California', SNA: 'California', FAT: 'California', SBA: 'California',
  // Estados Unidos - Oeste y Montañas
  RNO: 'Nevada', LAS: 'Nevada',
  PDX: 'Oregon', EUG: 'Oregon', MFR: 'Oregon', RDM: 'Oregon',
  SEA: 'Washington', GEG: 'Washington',
  DEN: 'Colorado',
  SLC: 'Utah',
  PHX: 'Arizona', TUS: 'Arizona',
  ABQ: 'Nuevo México', ELP: 'Texas',
  ANC: 'Alaska', FAI: 'Alaska',
  HNL: 'Hawái', OGG: 'Hawái', KOA: 'Hawái',
  // Estados Unidos - Texas
  IAH: 'Texas', HOU: 'Texas', DFW: 'Texas', AUS: 'Texas', SAT: 'Texas', OKC: 'Oklahoma', MCI: 'Misuri',
  // Estados Unidos - Costa Este y Sur
  MIA: 'Florida', FLL: 'Florida', TPA: 'Florida', MCO: 'Florida', RSW: 'Florida', PBI: 'Florida', JAX: 'Florida',
  ATL: 'Georgia',
  CLT: 'Carolina del Norte', RDU: 'Carolina del Norte',
  BNA: 'Tennessee',
  MSY: 'Luisiana',
  MEM: 'Tennessee',
  // Estados Unidos - Noreste
  JFK: 'Nueva York', LGA: 'Nueva York', EWR: 'Nueva Jersey', BOS: 'Massachusetts',
  PHL: 'Pensilvania', PIT: 'Pensilvania',
  BWI: 'Maryland', IAD: 'Virginia', DCA: 'Washington D.C.',
  // Estados Unidos - Centro y Grandes Lagos
  ORD: 'Illinois', MDW: 'Illinois',
  MSP: 'Minnesota',
  DTW: 'Míchigan',
  CLE: 'Ohio', CMH: 'Ohio',
  IND: 'Indiana',
  STL: 'Misuri',
  DSM: 'Iowa',
  MKE: 'Wisconsin',
  // Caribe / Latinoamérica (ejemplos)
  HAV: 'La Habana', HAV1: 'La Habana', HAV2: 'La Habana',
  VRA: 'Matanzas', SNU: 'Villa Clara', SCU: 'Santiago de Cuba',
  PUJ: 'La Altagracia', SDQ: 'Santo Domingo'
}

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

// Función de búsqueda inteligente
export function searchAirports(query: string, limit: number = 10): Airport[] {
  if (!query || query.length < 2) return []

  const searchTerm = normalizeText(query)
  const normalizedStateEntries = Object.entries(AIRPORT_STATE_MAP).reduce<Record<string, string>>((acc, [iata, state]) => {
    acc[iata] = normalizeText(state)
    return acc
  }, {})

  // Búsqueda por múltiples criterios (ignorando tildes)
  const results = AIRPORTS.filter(airport => {
    const stateMatch = normalizedStateEntries[airport.iata]?.includes(searchTerm)
    const cityNorm = normalizeText(airport.city)
    const countryNorm = normalizeText(airport.country)
    const nameNorm = normalizeText(airport.name)
    return (
      // Código IATA (exacto o parcial)
      airport.iata.toLowerCase().includes(searchTerm) ||
      // Ciudad (sin tildes)
      cityNorm.includes(searchTerm) ||
      // Estado o provincia (sin tildes)
      stateMatch ||
      // País (sin tildes)
      countryNorm.includes(searchTerm) ||
      // Nombre del aeropuerto (sin tildes)
      nameNorm.includes(searchTerm)
    )
  })

  // Ordenar por relevancia
  const sorted = results.sort((a, b) => {
    // Prioridad 1: Coincidencia exacta de código IATA
    if (a.iata.toLowerCase() === searchTerm) return -1
    if (b.iata.toLowerCase() === searchTerm) return 1

    // Prioridad 2: Código IATA empieza con búsqueda
    const aIataStarts = a.iata.toLowerCase().startsWith(searchTerm)
    const bIataStarts = b.iata.toLowerCase().startsWith(searchTerm)
    if (aIataStarts && !bIataStarts) return -1
    if (!aIataStarts && bIataStarts) return 1

    // Prioridad 3: Ciudad empieza con búsqueda
    const aCityStarts = normalizeText(a.city).startsWith(searchTerm)
    const bCityStarts = normalizeText(b.city).startsWith(searchTerm)
    if (aCityStarts && !bCityStarts) return -1
    if (!aCityStarts && bCityStarts) return 1

    // Prioridad 4: Aeropuertos internacionales primero
    if (a.type === 'international' && b.type !== 'international') return -1
    if (a.type !== 'international' && b.type === 'international') return 1

    // Por defecto: orden alfabético por ciudad (sin tildes)
    return normalizeText(a.city).localeCompare(normalizeText(b.city))
  })

  return sorted.slice(0, limit).map(airport => ({
    ...airport,
    state: AIRPORT_STATE_MAP[airport.iata]
  }))
}

// Función para obtener aeropuerto por código IATA
export function getAirportByIATA(iata: string): Airport | undefined {
  return AIRPORTS.find(airport => airport.iata.toLowerCase() === iata.toLowerCase())
}

// Función para obtener aeropuertos por país
export function getAirportsByCountry(countryCode: string): Airport[] {
  return AIRPORTS.filter(airport => airport.countryCode === countryCode)
}
