-- DEMOSVITA MVP - 9 MISIONES NUEVAS Y CATEGORÍA ASÓMBRATE
-- Fuente: Estructura General de Misiones — 24 misiones.
-- Solo inserta las 9 fichas que no existían en el catálogo anterior.
-- No modifica las 15 misiones publicadas, aunque se ejecute varias veces.

begin;

insert into public.missions (
  code, catalog_id, slug, title, tagline, description, category, difficulty, xp,
  conditions, feedback_questions, feedback_prompt, feedback_schema,
  image_url, sort_order, is_active, published_at
)
values
  (
    'M16_PIERDETE_A_PROPOSITO', 'dv-016', 'pierdete-a-proposito',
    'Piérdete a propósito',
    '“No todo lo que vaga está perdido.” — J.R.R. Tolkien',
    'Camina por un barrio durante al menos 45 minutos sin usar Google Maps ni ninguna app de navegación.',
    'Explora', 'Media', 110,
    '["Mínimo 45 minutos", "Móvil guardado o en modo avión", "Sin plan de ruta previo"]'::jsonb,
    '["¿Qué barrio elegiste?", "Foto de algo que encontraste sin buscarlo (opcional)", "¿Te perdiste en algún momento?", "¿Qué encontraste que no habrías visto con un plan fijo?", "¿Cómo te sentiste sin la seguridad del mapa?"]'::jsonb,
    'Foto opcional y respuestas sobre lo descubierto sin una ruta previa.',
    '[{"key":"q1","label":"¿Qué barrio elegiste?","type":"text","required":true},{"key":"photo","label":"Foto de algo que encontraste sin buscarlo (opcional)","type":"photo","required":false,"help":"Evita fotografiar a personas sin su permiso. Máximo 4 MB."},{"key":"q3","label":"¿Te perdiste en algún momento?","type":"textarea","required":true,"rows":3},{"key":"q4","label":"¿Qué encontraste que no habrías visto con un plan fijo?","type":"textarea","required":true,"rows":3},{"key":"q5","label":"¿Cómo te sentiste sin la seguridad del mapa?","type":"textarea","required":true,"rows":3}]'::jsonb,
    null, 16, true, now()
  ),
  (
    'M17_MESA_SIN_PANTALLAS', 'dv-017', 'la-mesa-sin-pantallas',
    'La mesa sin pantallas',
    '“La familia que come junta, permanece junta.” (dicho popular, sin autoría única identificada)',
    'Comparte una comida completa con alguien importante para ti —pareja, familia o amistad— con los móviles completamente fuera de la vista.',
    'Conecta', 'Media', 90,
    '["Móviles completamente fuera de la mesa, no solo en silencio", "Con alguien cercano a ti", "Toda la duración de la comida"]'::jsonb,
    '["¿Con quién y qué comida?", "Foto (opcional)", "¿De qué hablasteis que normalmente no sale?", "¿Alguien sintió la tentación de mirar el móvil?", "¿Cómo cambió la conversación respecto a otras veces?"]'::jsonb,
    'Foto opcional y respuestas sobre cómo cambió la conversación.',
    '[{"key":"q1","label":"¿Con quién y qué comida?","type":"text","required":true},{"key":"photo","label":"Foto (opcional)","type":"photo","required":false,"help":"Evita fotografiar a personas sin su permiso. Máximo 4 MB."},{"key":"q3","label":"¿De qué hablasteis que normalmente no sale?","type":"textarea","required":true,"rows":3},{"key":"q4","label":"¿Alguien sintió la tentación de mirar el móvil?","type":"textarea","required":true,"rows":3},{"key":"q5","label":"¿Cómo cambió la conversación respecto a otras veces?","type":"textarea","required":true,"rows":3}]'::jsonb,
    null, 17, true, now()
  ),
  (
    'M18_CABEZA_ARRIBA', 'dv-018', 'cabeza-arriba',
    'Cabeza arriba',
    '“El verdadero viaje de descubrimiento no consiste en buscar nuevos paisajes, sino en tener nuevos ojos.” — Marcel Proust',
    'Camina una ruta que haces casi todos los días con el móvil guardado y fíjate en tres detalles arquitectónicos que nunca habías notado.',
    'Contempla', 'Media', 90,
    '["Ruta habitual para ti", "Móvil fuera de alcance", "Mínimo 3 detalles distintos"]'::jsonb,
    '["¿Qué calle o zona?", "Foto de los detalles (opcional)", "¿Qué 3 cosas notaste?", "¿Cuánto tiempo llevas pasando por ahí sin fijarte?", "¿Cómo te sentiste al notarlo por fin?"]'::jsonb,
    'Foto opcional y respuestas sobre los detalles descubiertos.',
    '[{"key":"q1","label":"¿Qué calle o zona?","type":"text","required":true},{"key":"photo","label":"Foto de los detalles (opcional)","type":"photo","required":false,"help":"Evita fotografiar a personas sin su permiso. Máximo 4 MB."},{"key":"q3","label":"¿Qué 3 cosas notaste?","type":"textarea","required":true,"rows":3},{"key":"q4","label":"¿Cuánto tiempo llevas pasando por ahí sin fijarte?","type":"textarea","required":true,"rows":3},{"key":"q5","label":"¿Cómo te sentiste al notarlo por fin?","type":"textarea","required":true,"rows":3}]'::jsonb,
    null, 18, true, now()
  ),
  (
    'M19_DETENTE_ANTE_LA_OBRA', 'dv-019', 'detente-ante-la-obra',
    'Detente ante la obra',
    '“El arte no reproduce lo visible, sino que hace visible lo invisible.” — Paul Klee',
    'Ve a un museo, una exposición, una galería o cualquier espacio donde haya arte. Elige una sola obra y quédate frente a ella al menos 10 minutos, sin foto ni móvil.',
    'Descubre', 'Difícil', 160,
    '["Mínimo 10 minutos frente a la misma obra", "Sin fotos ni móvil durante ese tiempo", "Que no conocieras la obra de antes"]'::jsonb,
    '["¿Qué lugar y qué obra?", "Foto al terminar (opcional, ahora sí)", "¿Qué fuiste descubriendo con el tiempo que no viste al principio?", "¿En qué momento te entraron ganas de irte?", "¿Cómo te sentiste al final?"]'::jsonb,
    'Foto opcional al terminar y respuestas sobre la observación.',
    '[{"key":"q1","label":"¿Qué lugar y qué obra?","type":"textarea","required":true,"rows":3},{"key":"photo","label":"Foto al terminar (opcional, ahora sí)","type":"photo","required":false,"help":"Respeta las normas del espacio y evita fotografiar a personas. Máximo 4 MB."},{"key":"q3","label":"¿Qué fuiste descubriendo con el tiempo que no viste al principio?","type":"textarea","required":true,"rows":3},{"key":"q4","label":"¿En qué momento te entraron ganas de irte?","type":"textarea","required":true,"rows":3},{"key":"q5","label":"¿Cómo te sentiste al final?","type":"textarea","required":true,"rows":3}]'::jsonb,
    null, 19, true, now()
  ),
  (
    'M20_PERDON_SIN_PEROS', 'dv-020', 'el-perdon-sin-peros',
    'El perdón sin peros',
    '“Errar es humano, perdonar es divino.” — Alexander Pope',
    'Pide perdón a alguien por algo concreto que hiciste mal, sin condicionales ni excusas. Nada de “perdona si te molestó”: solo reconocer que te equivocaste.',
    'Supera', 'Difícil', 140,
    '["Una disculpa real por algo que reconoces haber hecho mal", "Cara a cara o por llamada, no por mensaje escrito", "Sin añadir justificaciones tipo “pero es que...”"]'::jsonb,
    '["¿A quién y por qué?", "Foto del lugar (opcional)", "¿Qué le dijiste exactamente?", "¿Cómo reaccionó?", "¿Qué te costó más, decidir hacerlo o decirlo?"]'::jsonb,
    'Foto opcional y respuestas privadas sobre la disculpa.',
    '[{"key":"q1","label":"¿A quién y por qué?","type":"textarea","required":true,"rows":3},{"key":"photo","label":"Foto del lugar (opcional)","type":"photo","required":false,"help":"No fotografíes a la otra persona sin permiso. Máximo 4 MB."},{"key":"q3","label":"¿Qué le dijiste exactamente?","type":"textarea","required":true,"rows":3},{"key":"q4","label":"¿Cómo reaccionó?","type":"textarea","required":true,"rows":3},{"key":"q5","label":"¿Qué te costó más, decidir hacerlo o decirlo?","type":"textarea","required":true,"rows":3}]'::jsonb,
    null, 20, true, now()
  ),
  (
    'M21_PARQUE_NUNCA_PISAS', 'dv-021', 'el-parque-que-nunca-pisas',
    'El parque que nunca pisas',
    '“En cada paseo con la naturaleza, uno recibe mucho más de lo que busca.” — John Muir',
    'Ve a un parque o zona verde de tu ciudad en la que nunca hayas estado y da un paseo de al menos 20 minutos.',
    'Asómbrate', 'Fácil', 70,
    '["Un parque o zona verde nueva para ti", "Mínimo 20 minutos", "Sin auriculares"]'::jsonb,
    '["¿Qué parque?", "Foto (opcional)", "¿Qué te sorprendió de él?", "¿Por qué crees que no habías ido antes?", "¿Cómo te sentiste al terminar?"]'::jsonb,
    'Foto opcional y respuestas sobre el lugar descubierto.',
    '[{"key":"q1","label":"¿Qué parque?","type":"text","required":true},{"key":"photo","label":"Foto (opcional)","type":"photo","required":false,"help":"Evita fotografiar a personas sin su permiso. Máximo 4 MB."},{"key":"q3","label":"¿Qué te sorprendió de él?","type":"textarea","required":true,"rows":3},{"key":"q4","label":"¿Por qué crees que no habías ido antes?","type":"textarea","required":true,"rows":3},{"key":"q5","label":"¿Cómo te sentiste al terminar?","type":"textarea","required":true,"rows":3}]'::jsonb,
    null, 21, true, now()
  ),
  (
    'M22_BUSCA_VIA_LACTEA', 'dv-022', 'busca-la-via-lactea',
    'Busca la Vía Láctea',
    '“Somos una forma en que el cosmos se conoce a sí mismo.” — Carl Sagan',
    'Ve con alguien de confianza a un lugar con poca contaminación lumínica y pasad al menos 30 minutos mirando el cielo nocturno, hablando y sin móviles.',
    'Asómbrate', 'Media', 100,
    '["Con otra persona de confianza", "Cielo relativamente oscuro, evitando el centro urbano", "Mínimo 30 minutos", "Sin móvil ni luz encendida"]'::jsonb,
    '["¿Con quién y dónde fuisteis?", "Foto (opcional)", "¿De qué hablasteis mientras mirabais el cielo?", "¿Cuántas estrellas lograsteis ver?", "¿Cómo cambió la conversación respecto a una charla normal?"]'::jsonb,
    'Foto opcional y respuestas sobre la observación compartida.',
    '[{"key":"q1","label":"¿Con quién y dónde fuisteis?","type":"text","required":true},{"key":"photo","label":"Foto (opcional)","type":"photo","required":false,"help":"Máximo 4 MB."},{"key":"q3","label":"¿De qué hablasteis mientras mirabais el cielo?","type":"textarea","required":true,"rows":3},{"key":"q4","label":"¿Cuántas estrellas lograsteis ver?","type":"textarea","required":true,"rows":3},{"key":"q5","label":"¿Cómo cambió la conversación respecto a una charla normal?","type":"textarea","required":true,"rows":3}]'::jsonb,
    null, 22, true, now()
  ),
  (
    'M23_CAMINA_SIN_ASFALTO', 'dv-023', 'camina-donde-no-hay-asfalto',
    'Camina donde no hay asfalto',
    '“Adopta el ritmo de la naturaleza: su secreto es la paciencia.” — Ralph Waldo Emerson',
    'Haz una caminata de al menos 1 hora y media por un entorno completamente natural —bosque, montaña o campo— sin cruzarte con carreteras, edificios o señales de civilización durante ese tiempo.',
    'Asómbrate', 'Difícil', 130,
    '["Mínimo 1 hora y 30 minutos", "Sin ver carreteras, edificios ni señales de civilización durante el recorrido", "Solo o acompañado"]'::jsonb,
    '["¿Dónde hiciste la ruta?", "Foto (opcional)", "¿Cuánto te costó no cruzarte con civilización?", "¿Cómo te sentías al empezar y cómo te sentías al terminar?", "¿Repetirías esta ruta?"]'::jsonb,
    'Foto opcional y respuestas sobre la caminata.',
    '[{"key":"q1","label":"¿Dónde hiciste la ruta?","type":"text","required":true},{"key":"photo","label":"Foto (opcional)","type":"photo","required":false,"help":"Máximo 4 MB."},{"key":"q3","label":"¿Cuánto te costó no cruzarte con civilización?","type":"textarea","required":true,"rows":3},{"key":"q4","label":"¿Cómo te sentías al empezar y cómo te sentías al terminar?","type":"textarea","required":true,"rows":3},{"key":"q5","label":"¿Repetirías esta ruta?","type":"select","required":true,"options":["Sí","No","No lo sé todavía"]}]'::jsonb,
    null, 23, true, now()
  ),
  (
    'M24_LA_CUMBRE', 'dv-024', 'la-cumbre',
    'La cumbre',
    '“No es la montaña la que conquistamos, sino a nosotros mismos.” — Edmund Hillary',
    'Haz una ruta de montaña de al menos 8 km y 400 m de desnivel positivo hasta un mirador o cima. Quédate al menos 15 minutos contemplando las vistas antes de bajar.',
    'Asómbrate', 'Épica', 190,
    '["Mínimo 8 km de ruta total", "Mínimo 400 m de desnivel positivo", "Punto con vistas amplias", "Mínimo 15 minutos contemplando"]'::jsonb,
    '["¿Qué ruta hiciste y cuáles fueron los kilómetros y el desnivel reales?", "Foto de las vistas (opcional)", "¿En qué momento te planteaste rendirte?", "¿Qué sentiste al llegar arriba?", "¿Cambió algo en cómo ves tus problemas después?"]'::jsonb,
    'Foto opcional y respuestas sobre la ruta y la llegada.',
    '[{"key":"q1","label":"¿Qué ruta hiciste y cuáles fueron los kilómetros y el desnivel reales?","type":"textarea","required":true,"rows":3},{"key":"photo","label":"Foto de las vistas (opcional)","type":"photo","required":false,"help":"Máximo 4 MB."},{"key":"q3","label":"¿En qué momento te planteaste rendirte?","type":"textarea","required":true,"rows":3},{"key":"q4","label":"¿Qué sentiste al llegar arriba?","type":"textarea","required":true,"rows":3},{"key":"q5","label":"¿Cambió algo en cómo ves tus problemas después?","type":"textarea","required":true,"rows":3}]'::jsonb,
    null, 24, true, now()
  )
on conflict (code) do nothing;

commit;

-- Deben aparecer exactamente 24 misiones activas y 4 en Asómbrate.
select category, count(*) as misiones
from public.missions
where is_active = true
group by category
order by category;

select sort_order, code, title, category, difficulty, xp
from public.missions
where code in (
  'M16_PIERDETE_A_PROPOSITO', 'M17_MESA_SIN_PANTALLAS', 'M18_CABEZA_ARRIBA',
  'M19_DETENTE_ANTE_LA_OBRA', 'M20_PERDON_SIN_PEROS', 'M21_PARQUE_NUNCA_PISAS',
  'M22_BUSCA_VIA_LACTEA', 'M23_CAMINA_SIN_ASFALTO', 'M24_LA_CUMBRE'
)
order by sort_order;
