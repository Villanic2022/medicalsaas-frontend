# Funcionalidad de Obras Sociales y Precios para Profesionales

## Funcionalidades Implementadas

### 1. Gestión de Obras Sociales en Profesionales

**En la página de administración de profesionales:**
- Se puede configurar qué obras sociales acepta cada profesional
- Se puede establecer el precio de la consulta particular
- Se muestra una lista con checkboxes de todas las obras sociales disponibles
- Los datos se almacenan junto con la información del profesional

**Campos agregados al formulario de profesionales:**
- `privateConsultationPrice`: Precio de la consulta particular (número)
- `acceptedInsurances`: Array de IDs de obras sociales aceptadas

### 2. Visualización en la Lista de Profesionales

**En la tabla de profesionales se muestra:**
- Una nueva columna "Consulta/Obras Sociales"
- El precio de la consulta particular con ícono de dinero
- Las primeras 2 obras sociales aceptadas + contador si hay más
- Indicación "No configurado" si no hay datos

### 3. Información en el Booking Público

**En la selección de profesional (Paso 1):**
- Cada tarjeta de profesional muestra el precio de consulta particular
- Muestra las obras sociales que acepta (máximo 2 + contador)
- Iconos distintivos para cada tipo de información

**En la selección de fecha/hora (Paso 2):**
- Panel informativo con resumen del profesional seleccionado
- Precio de consulta particular destacado
- Lista completa de obras sociales aceptadas

**En el formulario de datos del paciente (Paso 3):**
- Dropdown con las obras sociales que acepta el profesional
- Opción "Consulta Particular" siempre disponible
- Si no hay obras sociales configuradas, campo de texto libre

## Datos de Prueba (Mock)

Se incluye un archivo `mockInsuranceCompanies.js` con las siguientes obras sociales:
- OSDE
- Galeno
- APROSS
- Swiss Medical
- Medicus
- IOMA
- PAMI
- Sancor Salud

## Integración con Backend

### APIs que se necesitan implementar:

1. **GET /insurance-companies** - Lista de todas las obras sociales disponibles
2. **Actualizar modelo Professional** para incluir:
   ```json
   {
     "privateConsultationPrice": number,
     "acceptedInsurances": [
       { "id": number, "name": string, "code": string }
     ]
   }
   ```

### Campos a agregar en la base de datos:

**Tabla professionals:**
- `private_consultation_price` (decimal, nullable)

**Tabla insurance_companies:**
- `id` (primary key)
- `name` (string)
- `code` (string)
- `active` (boolean)

**Tabla professional_insurances (relación many-to-many):**
- `professional_id` (foreign key)
- `insurance_company_id` (foreign key)

## Flujo de Usuario

1. **Administrador configura profesional:**
   - Ingresa precio de consulta particular
   - Selecciona obras sociales que acepta
   - Guarda la configuración

2. **Paciente reserva turno:**
   - Ve la información de precios y obras sociales
   - Selecciona profesional conociendo los costos
   - Elige su obra social o consulta particular
   - Confirma el turno

## Beneficios

- **Transparencia:** El paciente conoce los costos antes de reservar
- **Eficiencia:** Menos consultas sobre precios y obras sociales
- **Organización:** Información centralizada y fácil de actualizar
- **Experiencia de usuario:** Proceso de reserva más informado

## Próximos Pasos

1. Implementar las APIs en el backend
2. Reemplazar mock data con llamadas reales
3. Agregar validaciones de negocio
4. Considerar agregar precios diferenciados por obra social
5. Implementar notificaciones de cambios de precio