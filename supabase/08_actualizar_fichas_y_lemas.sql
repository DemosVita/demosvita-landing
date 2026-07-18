-- DEMOSVITA MVP - ACTUALIZACIÓN DE FICHAS Y LEMAS
-- Fuente: Estructura General de Misiones — MVP Beta.
-- Es idempotente y conserva image_url, slug, categoría y reportes existentes.

begin;

alter table public.missions
  add column if not exists catalog_id text,
  add column if not exists feedback_questions jsonb not null default '[]'::jsonb;

create unique index if not exists missions_catalog_id_unique_idx
  on public.missions (catalog_id)
  where catalog_id is not null;

with updated_fiches (
  code,
  catalog_id,
  title,
  description,
  conditions,
  feedback_questions,
  feedback_prompt,
  tagline,
  difficulty,
  xp,
  sort_order
)
as (
values
  (
    'M02_COMERCIANTE_LOCAL',
    'explora-01',
    'El comerciante local',
    'Entra en un mercado o tienda de tu barrio. Habla con quien atiende. Pregúntale algo sobre su oficio.',
    '["En un comercio de tu barrio", "Debe ser alguien que trabaje ahí", "Al menos una pregunta genuina sobre su oficio"]'::jsonb,
    '["¿Dónde lo hiciste?", "Foto del sitio (opcional)", "¿Qué le preguntaste?", "¿Qué te contó que no esperabas?", "¿Cómo te sentiste al entrar y al salir?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“No tengo un talento especial. Solo soy apasionadamente curioso.” — Albert Einstein',
    'Fácil',
    70,
    1
  ),
  (
    'M03_ADOPTA_UN_LUGAR',
    'explora-02',
    'Adopta un lugar',
    'Ve al mismo café, parque o librería 3 veces esta semana, a la misma hora.',
    '["Mismo lugar, mismo horario", "3 visitas en una semana", "Sin cancelar por “hoy no me apetece”"]'::jsonb,
    '["¿Qué lugar elegiste?", "Foto del lugar (opcional, una por visita)", "¿Notó alguien que volvías?", "¿Qué cambió entre la primera y la tercera vez?", "¿Lo convertirás en costumbre?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“Si tú vienes, por ejemplo, a las cuatro de la tarde, desde las tres yo empezaría a ser dichoso.” — El Principito',
    'Media',
    120,
    2
  ),
  (
    'M04_EVENTO_QUE_NUNCA_HARIAS',
    'explora-03',
    'El evento que nunca harías',
    'Apúntate solo/a a una actividad grupal de tu barrio que nunca hayas probado.',
    '["Debe ser una actividad nueva para ti", "Ir sin acompañante", "Grupal, no individual"]'::jsonb,
    '["¿Qué actividad elegiste y dónde?", "Foto (opcional)", "¿Qué casi te hace no ir?", "¿Cómo te recibieron?", "¿Fue más fácil o más difícil de lo que esperabas?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“Haz algo que te asuste cada día.” — Eleanor Roosevelt',
    'Difícil',
    160,
    3
  ),
  (
    'M05_RECOMENDACION_DESCONOCIDO',
    'conecta-01',
    'La recomendación de un desconocido',
    'Pide a alguien que no conoces que te recomiende un libro, un sitio o una canción.',
    '["Debe ser un desconocido", "Pedir una recomendación concreta", "Anotar lo que te diga"]'::jsonb,
    '["¿Dónde lo hiciste?", "Foto (opcional)", "¿Qué te recomendó?", "¿Te atreverías a seguirla al pie de la letra?", "¿Cómo reaccionó al pedírselo?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“Un extraño es solo un amigo que aún no has conocido.” (atribución muy difundida, sin fuente primaria confirmada)',
    'Fácil',
    70,
    4
  ),
  (
    'M06_DIEZ_MINUTOS_SIN_SALIDA',
    'conecta-02',
    'Diez minutos sin salida',
    'Habla con un desconocido al menos 10 minutos, sin pedir nada concreto.',
    '["Mínimo 10 minutos reales de conversación", "Sin objetivo previo (no es para pedir nada)", "Con un desconocido"]'::jsonb,
    '["¿Dónde y con quién?", "Foto (opcional)", "¿De qué hablasteis?", "¿Cómo terminó la conversación?", "¿Cómo te sentiste antes de acercarte y después de despedirte?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“La mayoría de las personas no escuchan con la intención de comprender; escuchan con la intención de responder.” — Stephen Covey',
    'Media',
    100,
    5
  ),
  (
    'M01_HALAGO_HONESTO',
    'conecta-03',
    'El halago honesto',
    'Dile a alguien algo genuinamente positivo (un halago) que hayas notado, sin motivo.',
    '["A un desconocido", "En un lugar público", "Debe derivar en al menos 5 minutos de conversación"]'::jsonb,
    '["¿Dónde lo hiciste?", "Foto del sitio (opcional)", "¿Qué le dijiste exactamente?", "¿Cómo reaccionó?", "¿Fue más fácil o más difícil de lo que esperabas?", "¿Cómo te sentiste antes y después?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“El que se guarda un halago, se queda con algo que no es suyo.” — Pablo Picasso (atribución muy difundida, sin fuente primaria confirmada)',
    'Difícil',
    150,
    6
  ),
  (
    'M07_CAFE_SIN_PANTALLA',
    'contempla-01',
    'El café sin pantalla',
    'Toma un café. 30 minutos sin mirar el móvil.',
    '["30 minutos mínimo", "Móvil fuera de alcance, no solo en silencio", "Puede ser solo/a o acompañado/a"]'::jsonb,
    '["¿Dónde lo hiciste?", "Foto (opcional)", "¿Qué notaste que normalmente se te escapa?", "¿Cuántas veces sentiste el impulso de mirar el móvil?", "¿Cómo te sentiste al terminar?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“El silencio es pulsar el botón de off. Apagarlo. Todo.” — Khaled Hosseini',
    'Fácil',
    70,
    7
  ),
  (
    'M08_MODO_AVION_COMPARTIDO',
    'contempla-02',
    'Modo avión compartido',
    'Pon el móvil en modo avión 3 horas mientras haces algo con alguien.',
    '["3 horas seguidas", "Con otra persona presente", "Actividad compartida, no cada uno a lo suyo"]'::jsonb,
    '["¿Con quién y haciendo qué?", "Foto (opcional)", "¿Qué hicisteis con el tiempo de más?", "¿La otra persona lo notó?", "¿Cómo te sentiste antes y después?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“Ningún bien se disfruta sin compañía.” — Séneca',
    'Media',
    110,
    8
  ),
  (
    'M09_DIA_ENTERO_SIN_REDES',
    'contempla-03',
    'El día entero',
    'Pasa 24 horas sin redes sociales.',
    '["24 horas completas", "Sin excepciones “solo para mirar una cosa”", "Contárselo a alguien cercano al terminar"]'::jsonb,
    '["¿Qué día lo hiciste?", "Foto (opcional, del momento que más recuerdas de ese día)", "¿Qué hiciste con el tiempo que ganaste?", "¿En qué momento te costó más?", "¿Cómo te sentiste al final del día?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“Fui a los bosques porque quería vivir deliberadamente, enfrentar solo los hechos esenciales de la vida.” — Henry David Thoreau',
    'Difícil',
    160,
    9
  ),
  (
    'M10_LIBRERIA_AL_AZAR',
    'descubre-01',
    'Librería al azar',
    'Entra en una librería. Elige un libro solo por su portada, sin leer la sinopsis.',
    '["Sin leer la sinopsis ni buscar reseñas", "Decisión en menos de 2 minutos", "Debe comprarlo o apuntar el título"]'::jsonb,
    '["¿Qué librería?", "Foto del libro (opcional)", "¿Qué portada te llamó y por qué?", "¿Ya sabías algo de ese libro?", "¿Lo leerás de verdad?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“Siempre imaginé que el Paraíso sería algún tipo de biblioteca.” — Jorge Luis Borges',
    'Fácil',
    70,
    10
  ),
  (
    'M11_MANOS_OCUPADAS',
    'descubre-02',
    'Manos ocupadas',
    'Dedica 30 minutos a algo manual sin pantallas (dibujar, cocinar, reparar algo).',
    '["30 minutos mínimo", "Cero pantallas durante la actividad", "Debe quedar un resultado tangible"]'::jsonb,
    '["¿Qué hiciste?", "Foto del resultado (opcional)", "¿Cuánto tiempo hacía que no hacías algo así?", "¿Qué tal salió?", "¿Cómo te sentiste mientras lo hacías?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“Todo niño es un artista. El problema es cómo seguir siendo artista una vez que crecemos.” — Pablo Picasso',
    'Media',
    110,
    11
  ),
  (
    'M12_APRENDE_DE_UN_EXTRANO',
    'descubre-03',
    'Aprende de un extraño',
    'Pide a alguien que sepa hacer algo que tú no sepas que te lo enseñe, 15 minutos.',
    '["Debe ser algo que realmente no sepas hacer", "Mínimo 15 minutos de enseñanza", "No puede ser un profesional al que le pagues por ello"]'::jsonb,
    '["¿Qué aprendiste y de quién?", "Foto (opcional)", "¿Cómo le pediste que te enseñara?", "¿Qué fue lo más difícil de aprenderlo?", "¿Cómo te sentiste como principiante?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“Todo hombre que conozco es superior a mí en algún sentido; en eso, aprendo de él.” — Ralph Waldo Emerson',
    'Difícil',
    160,
    12
  ),
  (
    'M13_PIDE_SIN_MIEDO',
    'supera-01',
    'Pide sin miedo',
    'Pide algo que normalmente no pedirías: un descuento, cambiar de mesa, que te repitan algo.',
    '["Debe ser algo que normalmente evitas pedir", "Cara a cara, no por escrito", "Aceptar un posible “no”"]'::jsonb,
    '["¿Qué pediste y dónde?", "Foto (opcional)", "¿Qué te dijeron?", "¿Qué te frenaba normalmente para pedirlo?", "¿Cómo te sentiste al hacerlo?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“Pedir ayuda es una muestra de humildad, claridad, compromiso y fortaleza.” — Mario Alonso Puig',
    'Fácil',
    70,
    13
  ),
  (
    'M14_NO_QUE_SE_CONVIERTE_EN_SI',
    'supera-02',
    'El no que se convierte en sí',
    'Acepta esta semana algo a lo que sueles decir que no.',
    '["Algo a lo que sueles negarte por hábito, no por criterio real", "Dentro de los próximos 7 días", "Llegar hasta el final, no solo aceptar y luego cancelar"]'::jsonb,
    '["¿Qué aceptaste?", "Foto (opcional)", "¿Por qué sueles decir que no a esto normalmente?", "¿Qué tal fue?", "¿Cómo te sentiste al decir que sí?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“Di que sí, y luego aprende cómo hacerlo.” — Richard Branson',
    'Media',
    110,
    14
  ),
  (
    'M15_MOMENTO_INCOMODO',
    'supera-03',
    'El momento incómodo',
    'Haz algo en público que te dé vergüenza (cantar, bailar, hablar en grupo) al menos 10 segundos.',
    '["Mínimo 10 segundos", "En un espacio público real, no en casa", "Debe darte vergüenza de verdad, no ser cómodo desde el principio"]'::jsonb,
    '["¿Qué hiciste y dónde?", "Check “Lo hice” + foto opcional", "¿Cómo reaccionó la gente alrededor?", "¿Qué fue lo más difícil, el momento antes o durante?", "¿Cómo te sentiste después?"]'::jsonb,
    'Foto opcional y respuestas breves sobre la experiencia.',
    '“La vulnerabilidad no es debilidad.” — Brené Brown',
    'Difícil',
    160,
    15
  )
)
update public.missions as mission
set
  catalog_id = fiche.catalog_id,
  title = fiche.title,
  description = fiche.description,
  conditions = fiche.conditions,
  feedback_questions = fiche.feedback_questions,
  feedback_prompt = fiche.feedback_prompt,
  tagline = fiche.tagline,
  difficulty = fiche.difficulty,
  xp = fiche.xp,
  sort_order = fiche.sort_order,
  updated_at = now()
from updated_fiches as fiche
where mission.code = fiche.code;

commit;

-- Deben aparecer 15 fichas, todas con lema y preguntas de feedback.
select
  sort_order,
  catalog_id,
  code,
  title,
  tagline,
  jsonb_array_length(conditions) as condiciones,
  jsonb_array_length(feedback_questions) as preguntas_feedback
from public.missions
where is_active = true
order by sort_order, code;
