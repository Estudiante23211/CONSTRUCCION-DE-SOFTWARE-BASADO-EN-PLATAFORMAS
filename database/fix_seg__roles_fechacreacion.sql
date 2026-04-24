-- Ejecutar en phpMyAdmin sobre la base `kalsan_moda` si FechaCreacion queda NULL al crear roles.
-- 1) Rellena históricos sin fecha.
-- 2) Define valor por defecto automático en la columna (por si el cliente/API no envía fecha).

USE `kalsan_moda`;

UPDATE `seg__roles`
SET `FechaCreacion` = NOW()
WHERE `FechaCreacion` IS NULL;

ALTER TABLE `seg__roles`
  MODIFY COLUMN `FechaCreacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
