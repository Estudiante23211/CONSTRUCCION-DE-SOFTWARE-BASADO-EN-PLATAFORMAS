-- Ejecutar en phpMyAdmin (base kalsan_moda) si la tabla com__producto no tiene columna Codigo.

USE `kalsan_moda`;

ALTER TABLE `com__producto`
  ADD COLUMN `Codigo` VARCHAR(50) NULL DEFAULT NULL AFTER `IdProducto`;

UPDATE `com__producto`
SET `Codigo` = CONCAT('PRD-', `IdProducto`)
WHERE `Codigo` IS NULL OR `Codigo` = '';

ALTER TABLE `com__producto`
  ADD UNIQUE KEY `uq_com_producto_codigo` (`Codigo`);
