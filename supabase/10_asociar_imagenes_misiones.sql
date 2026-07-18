-- DEMOSVITA MVP - FOTOGRAFÍAS DEL CATÁLOGO
-- Asocia las 15 fotografías subidas a GitHub con sus misiones.
-- Es idempotente: puede ejecutarse más de una vez sin duplicar datos.

begin;

with mission_images (code, image_url) as (
values
  ('M02_COMERCIANTE_LOCAL', '/assets/misiones/1_Elcomerciantelocal.jpg'),
  ('M03_ADOPTA_UN_LUGAR', '/assets/misiones/2_Adoptaunlugar.jpg'),
  ('M04_EVENTO_QUE_NUNCA_HARIAS', '/assets/misiones/3_Eleventoquenuncaharias.jpg'),
  ('M05_RECOMENDACION_DESCONOCIDO', '/assets/misiones/4_Larecomendaciondeundesconocido.jpg'),
  ('M06_DIEZ_MINUTOS_SIN_SALIDA', '/assets/misiones/5_Diezminutossinsalida.jpg'),
  ('M01_HALAGO_HONESTO', '/assets/misiones/6_Elhalagohonesto.jpg'),
  ('M07_CAFE_SIN_PANTALLA', '/assets/misiones/7_Elcafesinpantalla.jpg'),
  ('M08_MODO_AVION_COMPARTIDO', '/assets/misiones/8_Modoavioncompartido.jpg'),
  ('M09_DIA_ENTERO_SIN_REDES', '/assets/misiones/9_Eldiaentero.jpg'),
  ('M10_LIBRERIA_AL_AZAR', '/assets/misiones/10_Libreriaalazar.jpg'),
  ('M11_MANOS_OCUPADAS', '/assets/misiones/11_Manosocupadas.jpg'),
  ('M12_APRENDE_DE_UN_EXTRANO', '/assets/misiones/12_Aprendedeunextra%C3%B1o.jpg'),
  ('M13_PIDE_SIN_MIEDO', '/assets/misiones/13_Pidesinmiedo.jpg'),
  ('M14_NO_QUE_SE_CONVIERTE_EN_SI', '/assets/misiones/14_Elnoqueseconvierteensi.jpg'),
  ('M15_MOMENTO_INCOMODO', '/assets/misiones/15_Elmomentoincomodo.jpg')
)
update public.missions as mission
set
  image_url = image.image_url,
  updated_at = now()
from mission_images as image
where mission.code = image.code;

commit;

select code, title, image_url
from public.missions
where is_active = true
order by sort_order, code;
