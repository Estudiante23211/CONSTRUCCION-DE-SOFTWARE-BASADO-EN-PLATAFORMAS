-- Quitar columna obsoleta (solo si existe en com__pedidos_detalle).
-- Instalaciones nuevas desde kalsan_moda_schema.sql no incluyen esta columna: omita este script.

USE `kalsan_moda`;

ALTER TABLE `com__pedidos_detalle` DROP COLUMN `EntregadoPorDescripcion`;
