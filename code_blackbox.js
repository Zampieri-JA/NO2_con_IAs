/*-----------------------------------------------------------------------------------------
SCRIPT DESAROLLADO CON EL OBJETIVO DE COMPARAR LAS RESPUESTAS PRESENTADAS POR BLACKBOX AI, 
MEDIANTE 3 INTRUCCIONES PARA REALIZAR UN BREVE ANALISIS DE LA CALIDAD DEL AIRE CON RESPECTO 
AL DIÓXIDO DE NITRÓGENO NO2 EN LA PROVINCIA ANDRES IBAÑEZ PARA EL MES DE ABRIL DE 2024
*/ //-------------------------------------------------------------------------------------

// INSTRUCCIÓN 1
/* ------------------------------------------------------------------------------------------
Asume el rol como investigador de la calidad del aire especializado en teledetección, 
tu objetivo es emplear de manera competente la API JavaScript de Google Earth Engine 
para evaluaciones de la calidad del aire en el distrito/provincia Andres Ibañez en Bolivia. 
En este chat, se le asignarán varias tareas y su tarea inicial se describe a continuación: 

Obtener imagen de Sentinel 5-P:
Obtenga imágenes Sentinel 5-P para NO2 utilizando el ID de colección correspondiente:
NO2: ee.ImageCollection("COPERNICUS/S5P/NRTI/L3_NO2") 

Filtra y extrae bandas adecuadas:
Filtre la colección con la banda adecuada para extraer resultados precisos de NO2 sobre la tropósfera.

Aplicar filtro de fecha:
Implementa un filtro de fecha en la colección desde del 1 de abril de 2024 al 30 de abril de 2024.

Parámetros de visualización:
Aplicar distintos parámetros de visualización. Utilizarás la paleta de colores 
'black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red' para mostrar la colección NO2.
*/ // ---------------------------------------------------------------------------------------

// Base de datos NO2: https://developers.google.com/earth-engine/datasets/catalog/sentinel-5p
// Base de datos área: https://developers.google.com/earth-engine/datasets/catalog/FAO_GAUL_2015_level2


// Importar la colección de imágenes Sentinel 5-P para NO2
var no2Collection = ee.ImageCollection("COPERNICUS/S5P/NRTI/L3_NO2");

// Filtrar la colección con la banda adecuada para extraer resultados precisos de NO2 sobre la tropósfera
var no2Band = no2Collection.select('tropospheric_NO2_column_number_density');

// Aplicar filtro de fecha
var startDate = '2024-04-01';
var endDate = '2024-04-30';
var no2Filtered = no2Band.filterDate(startDate, endDate);

// Aplicar parámetros de visualización
var visParams = {
  min: 0,
  max: 0.000023517853933852498,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};

// Representación espacial: extraer el límite administrativo del distrito Andres Ibañez en Bolivia
var santaCruzBoundary = ee.FeatureCollection("FAO/GAUL/2015/level2");
var andresIbanezBoundary = santaCruzBoundary.filter(ee.Filter.eq('ADM2_NAME', 'Andres Ibañez'));

// Calcular la media y recortar la imagen resultante con los límites del distrito Andres Ibañez
var no2Mean = no2Filtered.mean();
var clippedImage = no2Mean.clip(andresIbanezBoundary);

// Visualizar la imagen
Map.addLayer(clippedImage, visParams, 'NO2 Andrés Ibáñez');
Map.centerObject(andresIbanezBoundary, 9);



// INSTRUCCIÓN 2
/* ------------------------------------------------------------------------------------------
Continuando con su función como investigador de la calidad del aire, su próxima tarea es:

Obtener estadísticas de la imagen media recortada:
Del código anterior, seleccione nuevamente la banda utilizada y obtenga la media, mediana, moda, 
máximo y mínimo de NO2, e imprima todos los valores medios de Mean Composite en la consola.
*/ // ---------------------------------------------------------------------------------------


// Seleccionar nuevamente la banda utilizada
var no2Band = clippedImage.select('tropospheric_NO2_column_number_density');


// Obtener estadísticas de la imagen media recortada
var stats = no2Band.reduceRegion({
  reducer: ee.Reducer.mean().combine({
    reducer2: ee.Reducer.median(),
    sharedInputs: true
  }).combine({
    reducer2: ee.Reducer.mode(),
    sharedInputs: true
  }).combine({
    reducer2: ee.Reducer.max(),
    sharedInputs: true
  }).combine({
    reducer2: ee.Reducer.min(),
    sharedInputs: true
  }),
  geometry: andresIbanezBoundary,
  scale: 1000
});

// Imprimir los valores medios en la consola
print('Estadísticas de NO2 en Andrés Ibáñez:', stats);



// INSTRUCCIÓN 3
/* ------------------------------------------------------------------------------------------
Continuando con su función como investigador de la calidad del aire, ahora realice la clasificación 
de la imagen recortada de NO2 en el mismo código:

Clasificación de la imagen recortada:
Basado en los valores estadísticos del compuesto medio de NO2, que es 0.000010180823736852198 mol/m^2. 
Cree cuatro clases de concentración distintas: "Baja concentración de NO2", "Concentración moderada 
de NO2", "Alta concentración de NO2" y "Máxima concentración de NO2". Utilice un algoritmo de 
clasificación adecuado para definir umbrales de concentración para cada clase, mostrar el resultado 
clasificado en el mapa y recortar la imagen clasificada resultante con el límite del distrito Andres Ibañes.

Visualización del mapa: utilice los siguientes colores para representar cada clase en la imagen 
clasificada: verde para baja concentración de NO2, naranja para concentración moderada de NO2, 
rojo para alta concentración de NO2 y negro para mayor concentración de NO2. Cree una leyenda para 
la siguiente gama de colores para identificar las clases en el mapa.

Finalmente, imprima los resultados de la imagen clasificada en la consola, enfocándose en imprimir los 
valores de concentración de NO2 de cada clase por separado con una descripción de la imagen clasificada.
*/ // ---------------------------------------------------------------------------------------



// Definir los umbrales de concentración para cada clase
var thresholds = [0, 0.000005, 0.000010180823736852198, 0.000015, 0.00024];
var concentrations = ['Baja concentración de NO2', 'Concentración moderada de NO2', 'Alta concentración de NO2', 'Máxima concentración de NO2'];

// Clasificar la imagen utilizando el algoritmo de clasificación por umbrales
var classifiedImage = ee.Image(0).byte();
for (var i = 0; i < thresholds.length - 1; i++) {
  var mask = no2Band.gt(thresholds[i]).and(no2Band.lte(thresholds[i + 1]));
  classifiedImage = classifiedImage.where(mask, i + 1);
}

// Visualizar la imagen clasificada en el mapa
var visParams = {
  min: 1,
  max: 4,
  palette: ['green', 'orange', 'FF0000', '#780CCC']
};

var classifiedImage1 = classifiedImage.clip(andresIbanezBoundary)

Map.addLayer(classifiedImage1, visParams, 'Clasificación de NO2');



// Crear la leyenda
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px',
    backgroundColor: 'white'
  }
});
var legendTitle = ui.Label({
  value: 'NO2 con BLACKBOX AI',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 1 10px 0',
    padding: '0'
  }
});
legend.add(legendTitle);
legend.add(ui.Label({
  value: 'Clase 1: Baja concentración de NO2',
  style: {
    fontWeight: 'bold',
    backgroundColor: 'green'
  }
}));
var legendTitle2 = ui.Label({
  value: 'Created By: Jorge A. Zampieri',
  style: {
    fontWeight: 'bold',
    fontSize: '12px',
    margin: '2 1 10px 5',
    padding: '2'
  }
});
legend.add(ui.Label({
  value: '0.000000 - 0.000005 mol/m^2'
}));
legend.add(ui.Label({
  value: 'Clase 2: Concentración moderada de NO2',
  style: {
    fontWeight: 'bold',
    backgroundColor: 'orange'
  }
}));
legend.add(ui.Label({
  value: '0.000005 - 0.000010 mol/m^2'
}));
legend.add(ui.Label({
  value: 'Clase 3: Alta concentración de NO2',
  style: {
    fontWeight: 'bold',
    backgroundColor: 'red'
  }
}));
legend.add(ui.Label({
  value: '0.000010 - 0.000015 mol/m^2'
}));
legend.add(ui.Label({
  value: 'Clase 4: Máxima concentración de NO2',
  style: {
    fontWeight: 'bold',
    backgroundColor: '#780CCC'
  }
}));
legend.add(ui.Label({
  value: '0.000015 - 0.000024 mol/m^2'
}));
legend.add(legendTitle2);
Map.add(legend);


/* ------------------------------------------------------------------
            FIN DEL SCRIP
*/ // --------------------------------------------------------------
