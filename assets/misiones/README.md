# Imágenes de misiones

Las imágenes del catálogo se guardan en esta carpeta y se relacionan con la misión mediante el campo `public.missions.image_url`.

## Convención

- Formato preferido: WebP.
- Nombre: el mismo `slug` de la misión.
- Ejemplo: `assets/misiones/el-comerciante-local.webp`.
- Relación en Supabase: `/assets/misiones/el-comerciante-local.webp`.

Si `image_url` está vacío, la web muestra automáticamente el hueco gráfico de DemosVita. Esto permite publicar una misión antes de disponer de su imagen.

## Actualizar una imagen

1. Subir el archivo WebP a esta carpeta.
2. Ejecutar en Supabase:

```sql
update public.missions
set image_url = '/assets/misiones/el-comerciante-local.webp'
where slug = 'el-comerciante-local';
```
