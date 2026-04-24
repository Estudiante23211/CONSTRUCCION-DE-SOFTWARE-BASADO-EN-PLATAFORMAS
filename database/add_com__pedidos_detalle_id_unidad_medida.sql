-- Unidad de medida por línea de pedido (catálogo bas__unidad_medida).
USE `kalsan_moda`;

ALTER TABLE `com__pedidos_detalle`
  ADD COLUMN `IdUnidadMedida` INT NULL DEFAULT NULL AFTER `Cantidad`;

ALTER TABLE `com__pedidos_detalle`
  ADD CONSTRAINT `fk_detalle_unidad_medida` FOREIGN KEY (`IdUnidadMedida`) REFERENCES `bas__unidad_medida` (`IdUnidadMedida`);
