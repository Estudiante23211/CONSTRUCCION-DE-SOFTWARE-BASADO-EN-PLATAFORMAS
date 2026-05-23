-- Contraseña de demo para admin y ana: password
-- Ejecutar si el login falla con "contraseña incorrecta" tras importar el esquema antiguo.

USE `kalsan_moda`;

UPDATE `seg__usuario`
SET `Clave` = '$2b$10$.KINcFXBs6SsaX4qLC69LOAwExYINIfJSCph4CVjPqjR4Bx3elIhW'
WHERE `Usuario` IN ('admin', 'ana');
