# Plan de Implementación y Pruebas (Test Plan - Registro)

Este documento sirve como Plan de Implementación técnico para la creación de los tests en Playwright y como **Plan de Pruebas** estructurado para ser exportado a Jira, Confluence y XRay.

## Estructura para Jira / XRay

**Epic:** `EPIC-01` Implementación y Validación del Flujo de Registro (Familia y Profesional)
**Sprint:** Sprint Actual

### Historias de Usuario / Tareas (Jira Tasks)
1. **QA-101:** Crear `RegisterPage.ts` (Page Object) con los locators necesarios para el formulario de registro.
2. **QA-102:** Implementar Suite de Pruebas E2E para el rol "Familia" en `register-familia.spec.ts`.
3. **QA-103:** Implementar Suite de Pruebas E2E para el rol "Profesional" en `register-profesional.spec.ts`.

---

## Casos de Prueba (XRay Tests)

A continuación, el detalle de los 8 casos de prueba (4 para Familia, 4 para Profesional) divididos en positivos y negativos.

### Perfil Familia (4 Casos)

#### Pruebas Positivas
- **[TEST-01] Registro exitoso con datos válidos (Familia):**
  - *Descripción:* Verificar que un usuario puede registrarse correctamente seleccionando el rol "Familia" y completando todos los campos obligatorios.
  - *Resultado Esperado:* Redirección al Dashboard o pantalla de bienvenida y mensaje de éxito.
- **[TEST-02] Registro exitoso omitiendo campos opcionales (Familia):**
  - *Descripción:* Verificar que un usuario puede registrarse proporcionando únicamente los campos estrictamente obligatorios (email, contraseña, nombre).
  - *Resultado Esperado:* Registro exitoso sin errores de validación.

#### Pruebas Negativas
- **[TEST-03] Intento de registro con contraseñas que no coinciden (Familia):**
  - *Descripción:* Ingresar contraseñas diferentes en los campos "Contraseña" y "Confirmar Contraseña".
  - *Resultado Esperado:* El botón de registro se deshabilita o muestra un mensaje de error "Las contraseñas no coinciden".
- **[TEST-04] Intento de registro con un correo electrónico ya existente (Familia):**
  - *Descripción:* Usar un correo que ya se encuentra registrado en el sistema.
  - *Resultado Esperado:* Mensaje de error indicando que el correo ya está en uso.

### Perfil Profesional (4 Casos)

#### Pruebas Positivas
- **[TEST-05] Registro exitoso con datos básicos (Profesional):**
  - *Descripción:* Verificar que un usuario puede registrarse seleccionando el rol "Profesional" y completando los campos obligatorios (nombre, email, contraseña).
  - *Resultado Esperado:* Creación de cuenta exitosa.
- **[TEST-06] Registro exitoso incluyendo campos opcionales generales (Profesional):**
  - *Descripción:* Completar el registro "Profesional" llenando campos opcionales comunes (ej. teléfono, organización o descripción).
  - *Resultado Esperado:* Registro correcto con los datos adicionales guardados.

#### Pruebas Negativas
- **[TEST-07] Intento de registro sin aceptar términos y condiciones (Profesional):**
  - *Descripción:* Intentar enviar el formulario de registro "Profesional" sin marcar la casilla obligatoria de Términos y Condiciones.
  - *Resultado Esperado:* El formulario no se envía y se muestra un mensaje de validación.
- **[TEST-08] Intento de registro con contraseña demasiado corta (Profesional):**
  - *Descripción:* Ingresar una contraseña que no cumple con el mínimo de caracteres de seguridad.
  - *Resultado Esperado:* Error de validación en el campo de contraseña indicando los requisitos de seguridad.

---

## Cambios Propuestos (Playwright)

Para ejecutar este plan, crearemos los siguientes archivos en nuestro framework:

### Page Objects
#### [NEW] `e2e/pages/RegisterPage.ts`

### E2E Tests
#### [NEW] `e2e/tests/register-familia.spec.ts`
#### [NEW] `e2e/tests/register-profesional.spec.ts`
