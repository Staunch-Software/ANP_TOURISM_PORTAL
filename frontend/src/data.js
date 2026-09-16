import { IMG } from './images';

export const SLOTS = (seed) => ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'].map((t, i) => {
  const c = [[120, 'Available'], [86, 'Available'], [14, 'Limited'], [52, 'Available'], [0, 'Fully Booked'], [9, 'Limited'], [64, 'Available']][(i + seed) % 7];
  return { time: t, left: c[0], status: c[1], cap: 150 };
});
export const ATTR = [
{ id: 'A01', name: 'Radhanagar Beach', cat: 'Beaches', loc: 'Havelock Island (Swaraj Dweep)', img: IMG.radha, rate: 4.9, rev: 12480, hrs: '05:00 AM – 06:00 PM', time: '3–4 hrs', inr: 250, fx: 750,
  desc: 'Asia\u2019s finest white-sand beach, famed for its turquoise waters and spectacular sunsets.',
  about: 'Ranked among Asia\u2019s best beaches, Radhanagar Beach (Beach No. 7) stretches over 2 km of powder-white sand fringed by dense mahua forest. The gently shelving seabed and calm turquoise water make it ideal for swimming, while the western aspect delivers world-class sunsets.',
  high: ['Asia\u2019s No.1 ranked beach', 'Spectacular sunset viewpoint', 'Safe swimming zone with lifeguards', 'Dense mahua forest trail', 'Photography and drone zones'],
  fac: ['Lifeguard on duty', 'Changing rooms', 'Clean restrooms', 'Paid parking', 'Food kiosks', 'Wheelchair boardwalk', 'Drinking water', 'First aid post'],
  info: ['Entry closes at 05:00 PM for swimming', 'Plastic bottles are strictly prohibited', 'Swim only within flagged safe zones', 'Carry valid photo ID for verification', 'Drone flying requires prior permit'] },
{ id: 'A02', name: 'Cellular Jail National Memorial', cat: 'Heritage', loc: 'Atlanta Point, Port Blair', img: IMG.jail, rate: 4.8, rev: 9860, hrs: '09:00 AM – 05:00 PM', time: '2–3 hrs', inr: 300, fx: 900,
  desc: 'The colonial-era prison and national memorial that witnessed India\u2019s freedom struggle.',
  about: 'Kala Pani, the Cellular Jail, was built between 1896 and 1906 to isolate India\u2019s freedom fighters. Three of the original seven wings survive, along with the central watchtower, gallows and the museum galleries documenting the lives of the political prisoners held here.',
  high: ['Original prison wing and cells', 'Central watchtower view', 'Freedom fighters\u2019 gallery', 'Gallows and solitary block', 'Guided heritage walk (45 min)'],
  fac: ['Audio guide (6 languages)', 'Museum galleries', 'Souvenir shop', 'Cafeteria', 'Wheelchair access (ground floor)', 'Cloak room', 'Restrooms'],
  info: ['Closed on national holidays', 'Photography permitted; tripods restricted', 'Guided tours start hourly', 'Silence requested in memorial areas', 'Last entry 04:15 PM'] },
{ id: 'A03', name: 'Light & Sound Show — Cellular Jail', cat: 'Heritage', loc: 'Cellular Jail, Port Blair', img: IMG.night, rate: 4.7, rev: 7240, hrs: '06:00 PM & 07:15 PM', time: '1 hr', inr: 350, fx: 1000,
  desc: 'An evocative son-et-lumière narrating the story of the freedom struggle.',
  about: 'A moving 55-minute son-et-lumière performed in the jail courtyard, narrating the story of the freedom struggle through the voice of the old peepal tree that stood witness. Available in Hindi and English on alternating shows.',
  high: ['55-minute narrated performance', 'Hindi & English shows', 'Open-air courtyard seating', 'Immersive lighting design', 'Award-winning script'],
  fac: ['Covered seating', 'Reserved accessible seating', 'Parking', 'Restrooms', 'Assistive listening devices'],
  info: ['Arrive 20 minutes before showtime', 'Show cancelled in heavy rain — full refund', 'Late entry not permitted after start', 'Children below 3 enter free', 'Mobile phones on silent'] },
{ id: 'A04', name: 'Elephant Beach Water Sports', cat: 'Water Sports', loc: 'Havelock Island', img: IMG.water, rate: 4.7, rev: 8930, hrs: '08:30 AM – 04:00 PM', time: '4–5 hrs', inr: 1500, fx: 3200,
  desc: 'Snorkelling, sea-walking, jet ski and glass-bottom boat over living coral reef.',
  about: 'Reached by a 25-minute speedboat ride, Elephant Beach offers the archipelago\u2019s most accessible fringing reef. The shallow lagoon supports snorkelling, sea walking, scuba discovery dives, jet ski and banana boat rides under certified operator supervision.',
  high: ['Sea walking on reef floor', 'Guided snorkelling with instructor', 'Glass-bottom boat ride', 'Jet ski & banana boat', 'Discover-scuba for beginners'],
  fac: ['Certified PADI instructors', 'Equipment included', 'Lockers', 'Changing rooms', 'Boat transfers', 'Safety briefing', 'Medical support'],
  info: ['Medical fitness declaration required', 'Not advisable for cardiac/asthmatic conditions', 'Minimum age 10 for sea walk', 'Activities subject to sea conditions', 'Reef-safe sunscreen only'] },
{ id: 'A05', name: 'Ross Island (Netaji Subhas Dweep)', cat: 'Heritage', loc: '3 km east of Port Blair', img: IMG.ross, rate: 4.6, rev: 6120, hrs: '08:30 AM – 04:00 PM', time: '2–3 hrs', inr: 200, fx: 600,
  desc: 'The ruined colonial capital reclaimed by banyan roots and roaming deer.',
  about: 'Once the administrative headquarters of the British penal settlement, Ross Island was abandoned after the 1941 earthquake. Its church, bakery, ballroom and cemetery now stand entwined in banyan and ficus roots, with spotted deer and peacocks roaming freely.',
  high: ['Colonial ruins & Presbyterian church', 'Resident deer and peacocks', 'Japanese WWII bunkers', 'Light & sound show (evening)', 'Panoramic harbour viewpoint'],
  fac: ['Ferry jetty', 'Battery buggy service', 'Guided tours', 'Refreshment stall', 'Restrooms', 'Shaded rest points'],
  info: ['Ferry ticket booked separately', 'Do not feed the wildlife', 'Wear comfortable walking shoes', 'Last ferry returns 04:45 PM', 'Managed by Indian Navy'] },
{ id: 'A06', name: 'Samudrika Naval Marine Museum', cat: 'Museums', loc: 'Haddo, Port Blair', img: IMG.museum, rate: 4.5, rev: 4310, hrs: '09:00 AM – 05:00 PM', time: '1–2 hrs', inr: 150, fx: 400,
  desc: 'Five galleries on island ecology, tribes, marine life and the archipelago\u2019s geology.',
  about: 'Run by the Indian Navy, Samudrika presents five thematic galleries covering the geography, tribal communities, archaeology, marine life and coral ecosystems of the Andaman and Nicobar Islands, including a live aquarium and a preserved blue whale skeleton.',
  high: ['Blue whale skeleton exhibit', 'Live coral aquarium', 'Indigenous tribes gallery', 'Shell and coral collection', 'Island geology walkthrough'],
  fac: ['Air conditioned', 'Fully wheelchair accessible', 'Souvenir shop', 'Guided tours', 'Restrooms', 'Cloak room'],
  info: ['Closed on Mondays', 'Photography prohibited in gallery 3', 'Bags to be deposited at cloak room', 'Last entry 04:30 PM', 'Student discount with valid ID'] },
{ id: 'A07', name: 'Mangrove Creek Safari', cat: 'Nature', loc: 'Baratang Island', img: IMG.mangrove, rate: 4.6, rev: 3890, hrs: '06:00 AM – 02:00 PM', time: '5–6 hrs', inr: 900, fx: 2200,
  desc: 'Boat safari through mangrove tunnels to the Baratang limestone caves.',
  about: 'A guided speedboat safari threads through dense mangrove tunnels of Baratang Island toward the natural limestone caves. The route passes through the Jarawa Tribal Reserve, which is traversed under regulated convoy protocol.',
  high: ['Mangrove tunnel boat ride', 'Limestone cave formations', 'Mud volcano site', 'Rich birdwatching', 'Convoy through tribal reserve'],
  fac: ['Certified boat operators', 'Life jackets provided', 'Naturalist guide', 'Packed breakfast', 'Restrooms at jetty'],
  info: ['Departure 04:00 AM from Port Blair', 'Photography of tribal reserve strictly prohibited', 'Convoy timings are non-negotiable', 'Not suitable for infants', 'Carry government photo ID'] },
{ id: 'A08', name: 'Chidiya Tapu Sunset Point', cat: 'Nature', loc: '25 km from Port Blair', img: IMG.bird, rate: 4.7, rev: 5240, hrs: '05:00 AM – 06:30 PM', time: '2–3 hrs', inr: 100, fx: 300,
  desc: 'Birdwatcher\u2019s paradise with the finest sunset viewpoint on South Andaman.',
  about: 'Known as Bird Island, Chidiya Tapu is a biodiversity hotspot with over 45 recorded species, a small biological park, forest trails and a rocky promontory that offers the finest sunset vista on South Andaman.',
  high: ['45+ recorded bird species', 'Munda Pahad sunset trek', 'Biological park', 'Mangrove nature trail', 'Quiet swimming cove'],
  fac: ['Parking', 'Forest trail markers', 'Watchtower', 'Refreshment stall', 'Restrooms'],
  info: ['Best visited 04:00–06:30 PM', 'Trail closes at dusk', 'Carry insect repellent', 'No open fires permitted', 'Limited mobile network'] },
{ id: 'A09', name: 'Scuba Diving — Nemo Reef', cat: 'Water Sports', loc: 'Neil Island (Shaheed Dweep)', img: IMG.scuba, rate: 4.8, rev: 3120, hrs: '07:00 AM – 03:00 PM', time: '3–4 hrs', inr: 3500, fx: 6500,
  desc: 'PADI certified dives on pristine reef with 20m+ visibility year-round.',
  about: 'Nemo Reef off Neil Island offers gentle currents, 20m+ visibility and healthy hard-coral gardens, making it ideal for both discovery dives and certified fun-dives. All dives are conducted by PADI-certified professionals with a maximum 2:1 diver-to-instructor ratio.',
  high: ['PADI certified instructors', '20m+ visibility', 'Discovery dive for beginners', 'Underwater photography included', 'Hard coral gardens'],
  fac: ['All gear included', 'Dive briefing', 'Underwater camera', 'Hot showers', 'Lockers', 'Oxygen kit onboard'],
  info: ['No flying for 18 hours after diving', 'Medical questionnaire mandatory', 'Minimum age 12', 'Certified divers to carry log book', 'Weather-dependent scheduling'] },
{ id: 'A10', name: 'Sea Kayaking — Bioluminescence', cat: 'Island Experiences', loc: 'Havelock Island', img: IMG.kayak, rate: 4.9, rev: 2180, hrs: '05:30 AM & 07:30 PM', time: '2–3 hrs', inr: 2500, fx: 4500,
  desc: 'Paddle mangrove channels at dawn, or glowing plankton waters by night.',
  about: 'A small-group kayak expedition through the mangrove channels of Havelock. The night departure, scheduled around the new moon, reveals bioluminescent plankton that glows with every paddle stroke.',
  high: ['Night bioluminescence paddle', 'Dawn mangrove expedition', 'Small groups (max 8)', 'Certified kayak guides', 'No experience required'],
  fac: ['Kayak & gear provided', 'Life jackets', 'Dry bags', 'Guide-led briefing', 'Hot beverages'],
  info: ['Night tours subject to lunar cycle', 'Basic swimming ability required', 'Minimum age 12', 'No flash photography at night', 'Booking closes 24 hrs prior'] },
{ id: 'A11', name: 'Coral Reef Snorkelling — North Bay', cat: 'Water Sports', loc: 'North Bay Island', img: IMG.coral, rate: 4.5, rev: 6740, hrs: '08:00 AM – 03:30 PM', time: '3–4 hrs', inr: 1200, fx: 2800,
  desc: 'Shallow-reef snorkelling and glass-bottom boats ten minutes from Port Blair.',
  about: 'North Bay Island, featured on the twenty-rupee note, is the most accessible reef from Port Blair. Its shallow lagoon suits first-time snorkellers, with glass-bottom boats for non-swimmers and a lighthouse trail on the island.',
  high: ['Featured on ₹20 note', 'Beginner-friendly shallow reef', 'Glass-bottom boat', 'Lighthouse trail', 'Underwater sea walk'],
  fac: ['Snorkel gear included', 'Instructor supervision', 'Changing rooms', 'Food stalls', 'Life jackets', 'Lockers'],
  info: ['Ferry from Rajiv Gandhi Water Sports Complex', 'Do not touch or stand on coral', 'Reef-safe sunscreen only', 'Activities close 03:30 PM', 'Sea conditions may cause cancellation'] },
{ id: 'A12', name: 'Island Family Day Pass', cat: 'Island Experiences', loc: 'Port Blair Circuit', img: IMG.family, rate: 4.4, rev: 2960, hrs: '09:00 AM – 07:00 PM', time: 'Full day', inr: 1800, fx: 4000,
  desc: 'One pass, five attractions — designed for families travelling with children.',
  about: 'A single combo pass covering five family-friendly attractions across the Port Blair circuit, including museum entries, the water sports complex, Corbyn\u2019s Cove Beach and reserved seating at the evening Light & Sound Show.',
  high: ['Five attractions, one pass', 'Children under 5 free', 'Skip-the-queue entry', 'Reserved show seating', 'Flexible same-day usage'],
  fac: ['Shuttle between venues', 'Stroller friendly', 'Baby changing rooms', 'Family restrooms', 'Kids\u2019 menu at cafés'],
  info: ['Valid for one calendar day only', 'Non-transferable', 'Each venue scanned once', 'Shuttle runs every 40 minutes', 'Child age proof may be requested'] }];

export const CATS = ['All', 'Beaches', 'Heritage', 'Museums', 'Water Sports', 'Nature', 'Island Experiences'];
export const EXPS = [
{ n: 'Beach Escapes', c: '14 attractions', i: IMG.radha }, { n: 'Water Sports', c: '22 activities', i: IMG.water },
{ n: 'Heritage', c: '9 landmarks', i: IMG.jail }, { n: 'Nature & Wildlife', c: '11 trails', i: IMG.bird },
{ n: 'Island Adventures', c: '18 experiences', i: IMG.kayak }, { n: 'Museums', c: '6 galleries', i: IMG.museum },
{ n: 'Light & Sound', c: '3 shows', i: IMG.night }, { n: 'Family Experiences', c: '12 packages', i: IMG.family }];

export const FERRIES = [
{ id: 'FR-101', n: 'Makruzz Gold', r: 'Port Blair → Havelock', d: '18 Sep 2026', dep: '08:00 AM', arr: '09:30 AM', cap: 320, left: 84, st: 'Available', fare: 1450 },
{ id: 'FR-102', n: 'Green Ocean 1', r: 'Port Blair → Neil Island', d: '18 Sep 2026', dep: '10:30 AM', arr: '12:00 PM', cap: 280, left: 12, st: 'Limited', fare: 1200 },
{ id: 'FR-103', n: 'ITT Majestic', r: 'Havelock → Neil Island', d: '18 Sep 2026', dep: '01:15 PM', arr: '02:15 PM', cap: 240, left: 0, st: 'Fully Booked', fare: 1100 },
{ id: 'FR-104', n: 'Sea Link Cruise', r: 'Neil Island → Port Blair', d: '18 Sep 2026', dep: '04:00 PM', arr: '05:40 PM', cap: 300, left: 146, st: 'Available', fare: 1350 },
{ id: 'FR-105', n: 'Govt. Ferry DSS-9', r: 'Port Blair → Baratang', d: '19 Sep 2026', dep: '06:15 AM', arr: '09:00 AM', cap: 180, left: 38, st: 'Available', fare: 640 },
{ id: 'FR-106', n: 'Makruzz Pearl', r: 'Havelock → Port Blair', d: '19 Sep 2026', dep: '04:30 PM', arr: '06:00 PM', cap: 320, left: 7, st: 'Limited', fare: 1450 }];

export const BOOKINGS = [
{ id: 'AND-2026-084721', a: 'Radhanagar Beach', d: '18 Sep 2026', t: '09:00 AM', v: 3, amt: 1041, st: 'Confirmed', tab: 'Upcoming' },
{ id: 'AND-2026-084655', a: 'Light & Sound Show', d: '18 Sep 2026', t: '06:00 PM', v: 3, amt: 1239, st: 'Confirmed', tab: 'Upcoming' },
{ id: 'AND-2026-084512', a: 'Cellular Jail National Memorial', d: '19 Sep 2026', t: '10:00 AM', v: 3, amt: 1062, st: 'Confirmed', tab: 'Upcoming' },
{ id: 'AND-2026-081190', a: 'Samudrika Marine Museum', d: '02 Aug 2026', t: '11:00 AM', v: 2, amt: 354, st: 'Completed', tab: 'Completed' },
{ id: 'AND-2026-079003', a: 'North Bay Snorkelling', d: '28 Jul 2026', t: '08:00 AM', v: 4, amt: 5664, st: 'Completed', tab: 'Completed' },
{ id: 'AND-2026-076441', a: 'Chidiya Tapu Sunset Point', d: '11 Jul 2026', t: '04:00 PM', v: 2, amt: 236, st: 'Cancelled', tab: 'Cancelled' }];

export const VISITORS = [
{ id: 1, n: 'Arun Krishnan', t: 'Adult', nat: 'Indian', dob: '12 Mar 1989', idn: 'XXXX XXXX 4412' },
{ id: 2, n: 'Meera Krishnan', t: 'Adult', nat: 'Indian', dob: '04 Jul 1991', idn: 'XXXX XXXX 7781' },
{ id: 3, n: 'Kavya Krishnan', t: 'Child', nat: 'Indian', dob: '22 Nov 2017', idn: 'Birth Cert. 2017' },
{ id: 4, n: 'Daniel Whitmore', t: 'Adult', nat: 'Foreign', dob: '09 Jan 1985', idn: 'Passport GB-4429' }];

export const NOTIFS = [
{ t: 'Your Light & Sound Show starts in 2 hours', s: 'Cellular Jail · 18 Sep, 06:00 PM · Gate 2 opens 05:40 PM', ts: '20 minutes ago', c: 'Reminder', ic: 'clock', cl: 'b-warn' },
{ t: 'Your booking has been confirmed', s: 'AND-2026-084721 · Radhanagar Beach · 3 visitors', ts: '2 hours ago', c: 'Booking', ic: 'check2', cl: 'b-ok' },
{ t: 'Your payment was successful', s: '₹1,041 paid via UPI · Transaction TXN8847213', ts: '2 hours ago', c: 'Payment', ic: 'card', cl: 'b-info' },
{ t: 'Your group booking is awaiting administrator approval', s: 'GRP-2026-0391 · 48 visitors · Submitted 16 Sep', ts: 'Yesterday', c: 'Group', ic: 'users', cl: 'b-turq' },
{ t: 'Ferry schedule updated for 19 September', s: 'Makruzz Pearl departure moved to 04:30 PM', ts: '2 days ago', c: 'Ferry', ic: 'ship', cl: 'b-grey' }];