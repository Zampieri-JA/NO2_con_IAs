/*-----------------------------------------------------------------------------------------
SCRIPT DESAROLLADO CON EL OBJETIVO DE COMPARAR LAS RESPUESTAS PRESENTADAS POR CHATGPT, 
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


// Importar las colecciones necesarias
var s5pNO2 = ee.ImageCollection("COPERNICUS/S5P/NRTI/L3_NO2");
var gaul = ee.FeatureCollection("FAO/GAUL/2015/level2");

// Filtrar la colección NO2 por fecha y seleccionar la banda 'tropospheric_NO2_column_number_density'
var no2April2024 = s5pNO2
  .filterDate('2024-04-01', '2024-04-30')
  .select('tropospheric_NO2_column_number_density');

// Filtrar el límite administrativo del distrito/provincia Andres Ibañez en Bolivia
var andresIbanez = gaul
  .filter(ee.Filter.eq('ADM2_NAME', 'Andres Ibañez'))
  //.filter(ee.Filter.eq('ADM1_NAME', 'Santa Cruz'))
  //.first();  // Solo hay uno, así que tomamos el primer (y único) resultado

// Reducir la colección a una imagen que represente la media de NO2 sobre el mes de abril 2024
var no2MeanApril2024 = no2April2024.mean();

// Recortar la imagen de NO2 a los límites del distrito Andres Ibañez
var no2Clipped = no2MeanApril2024.clip(andresIbanez);

// Definir los parámetros de visualización
var visParams = {
  min: 0.0,
  max: 0.000021723828843350753, // parámetro modificado para visualización
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};

// Agregar la imagen recortada al mapa
Map.centerObject(andresIbanez, 9);  // Centrar el mapa en el distrito Andres Ibañez

// Agregar los límites del distrito al mapa para referencia
Map.addLayer(andresIbanez, {}, 'Límites de Andres Ibañez')
Map.addLayer(no2Clipped, visParams, 'Media de NO2 en Abril 2024');

// Mostrar los límites del distrito en la consola
print('Límites de Andres Ibañez', andresIbanez);


// INSTRUCCIÓN 2
/* ------------------------------------------------------------------------------------------
Continuando con su función como investigador de la calidad del aire, su próxima tarea es:

Obtener estadísticas de la imagen media recortada:
Del código anterior, seleccione nuevamente la banda utilizada y obtenga la media, mediana, moda, 
máximo y mínimo de NO2, e imprima todos los valores medios de Mean Composite en la consola.
*/ // ---------------------------------------------------------------------------------------


// Calcular las estadísticas de la imagen recortada
var stats = no2Clipped.reduceRegion({
  reducer: ee.Reducer.mean()
    .combine(ee.Reducer.median(), '', true)
    .combine(ee.Reducer.mode(), '', true)
    .combine(ee.Reducer.minMax(), '', true),
  geometry: andresIbanez.geometry(),
  scale: 1000,
  maxPixels: 1e9
});

// Imprimir las estadísticas en la consola
print('Estadísticas de NO2 para Abril 2024 en Andres Ibañez:', stats);


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


// Clasificación basada en umbrales
var thresholds = [0, 0.000005, 0.000010180823736852198, 0.000015, 0.00024];
var classified = no2Clipped.lt(thresholds[1]).multiply(1)
  .add(no2Clipped.gte(thresholds[1]).and(no2Clipped.lt(thresholds[2])).multiply(2))
  .add(no2Clipped.gte(thresholds[2]).and(no2Clipped.lt(thresholds[3])).multiply(3))
  .add(no2Clipped.gte(thresholds[3]).multiply(4));

// Definir los colores para cada clase
var classColors = ['green', 'orange', 'red', 'black'];

// Definir parámetros de visualización para la imagen clasificada
var classVisParams = {
  min: 1,
  max: 4,
  palette: classColors
};

// Agregar la imagen clasificada al mapa
Map.addLayer(classified, classVisParams, 'Clasificación de NO2');

// Crear una leyenda para la clasificación
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

var legendTitle = ui.Label({
  value: 'NO2 con ChatGPT',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});

legend.add(legendTitle);

var makeRow = function(color, name) {
  var colorBox = ui.Label({
    style: {
      backgroundColor: color,
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });

  var description = ui.Label({
    value: name,
    style: {margin: '0 0 4px 6px'}
  });

  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
};

var names = ['Baja concentración de NO2', 'Concentración moderada de NO2', 'Alta concentración de NO2', 'Máxima concentración de NO2'];

for (var i = 0; i < 4; i++) {
  legend.add(makeRow(classColors[i], names[i]));
}

Map.add(legend);

// Imprimir los resultados de la imagen clasificada en la consola
var classStats = classified.reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(),
  geometry: andresIbanez.geometry(),
  scale: 1000,
  maxPixels: 1e9
});

print('Resultados de la imagen clasificada:', classStats);

var legendTitle2 = ui.Label({
  value: 'Created By: Jorge A. Zampieri',
  style: {
    fontWeight: 'bold',
    fontSize: '12px',
    margin: '2 1 10px 5',
    padding: '2'
  }
});
legend.add(legendTitle2);

/* ------------------------------------------------------------------
            FIN DEL SCRIP
*/ // --------------------------------------------------------------

