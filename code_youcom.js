/*-----------------------------------------------------------------------------------------
SCRIPT DESAROLLADO CON EL OBJETIVO DE COMPARAR LAS RESPUESTAS PRESENTADAS POR YOUCOM, 
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




var collection = ee.ImageCollection("COPERNICUS/S5P/NRTI/L3_NO2");

var filteredCollection = collection.select("tropospheric_NO2_column_number_density");

var startDate = ee.Date("2024-04-01");
var endDate = ee.Date("2024-04-30");
var filteredByDate = filteredCollection.filterDate(startDate, endDate);

var visParams = {
  min: 0,
  max: 0.00002389483334412353,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};


var districtBoundary = ee.FeatureCollection("FAO/GAUL/2015/level2")
  .filter(ee.Filter.eq('ADM2_NAME', 'Andres Ibañez'));

var clippedImage = filteredByDate.mean().clip(districtBoundary);

Map.addLayer(clippedImage, visParams, 'NO2');
Map.addLayer(districtBoundary, visParams, 'NO2 - Distrito Andres Ibañez');


// INSTRUCCIÓN 2
/* ------------------------------------------------------------------------------------------
Continuando con su función como investigador de la calidad del aire, su próxima tarea es:

Obtener estadísticas de la imagen media recortada:
Del código anterior, seleccione nuevamente la banda utilizada y obtenga la media, mediana, moda, 
máximo y mínimo de NO2, e imprima todos los valores medios de Mean Composite en la consola.
*/ // ---------------------------------------------------------------------------------------



var mean = clippedImage.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: districtBoundary,
  scale: 1000
});

var median = clippedImage.reduceRegion({
  reducer: ee.Reducer.median(),
  geometry: districtBoundary,
  scale: 1000
});

var mode = clippedImage.reduceRegion({
  reducer: ee.Reducer.mode(),
  geometry: districtBoundary,
  scale: 1000
});

var max = clippedImage.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: districtBoundary,
  scale: 1000
});

var min = clippedImage.reduceRegion({
  reducer: ee.Reducer.min(),
  geometry: districtBoundary,
  scale: 1000
});

print('Media: ', mean.get('tropospheric_NO2_column_number_density'));
print('Mediana: ', median.get('tropospheric_NO2_column_number_density'));
print('Moda: ', mode.get('tropospheric_NO2_column_number_density'));
print('Máximo: ', max.get('tropospheric_NO2_column_number_density'));
print('Mínimo: ', min.get('tropospheric_NO2_column_number_density'));



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



// Define los valores de umbral
var umbralBajo = 0; // Baja concentración de NO2
var umbralModerado = 0.00001; // Concentración moderada de NO2
var umbralAlto = 0.000015; // Alta concentración de NO2
var umbralMaximo = 0.00002; // Máxima concentración de NO2

// Clasifica la imagen basada en los valores de umbral
var imagenClasificada1 = clippedImage.expression(
  "((b('tropospheric_NO2_column_number_density') <= umbralBajo) ? 0" +
  ": (b('tropospheric_NO2_column_number_density') <= umbralModerado) ? 1" +
  ": (b('tropospheric_NO2_column_number_density') <= umbralAlto) ? 2" +
  ": 3)",
  {
    umbralBajo: umbralBajo,
    umbralModerado: umbralModerado,
    umbralAlto: umbralAlto
  }
).rename('clasificacion');

// Colormap para la visualización
var colorBajo = '00FF00'; // Verde
var colorModerado = 'FFA500'; // Naranja
var colorAlto = 'FF0000'; // Rojo
var colorMaximo = '#780CCC'; // Lila

// Clip con Andres Ibañes
var imagenClasificada = imagenClasificada1.clip(districtBoundary)

// Visualiza la imagen clasificada en el mapa
Map.addLayer(imagenClasificada, {min: 0, max: 3, palette: [colorBajo, colorModerado, colorAlto, colorMaximo]}, 'Imagen Clasificada');

// Define la leyenda para la visualización
var leyenda = [
  'Baja concentración de NO2',
  'Concentración moderada de NO2',
  'Alta concentración de NO2',
  'Máxima concentración de NO2'
];
var coloresLeyenda = [colorBajo, colorModerado, colorAlto, colorMaximo];
var leyendaPanel = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px'
  }
});
var leyendaTitulo = ui.Label({
  value: 'NO2 con YOUCOM',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});
var legendTitle2 = ui.Label({
  value: 'Created By: Jorge A. Zampieri',
  style: {
    fontWeight: 'bold',
    fontSize: '12px',
    margin: '2 1 10px 5',
    padding: '2'
  }
});
leyendaPanel.add(leyendaTitulo);

for (var i = 0; i < leyenda.length; i++) {
  var color = coloresLeyenda[i];
  var etiqueta = ui.Label({
    value: leyenda[i],
    style: {
      fontSize: '18px',
      margin: '0 0 4px 0',
      padding: '0 8px',
      backgroundColor: color
    }
  });
  leyendaPanel.add(etiqueta);
}
leyendaPanel.add(legendTitle2);
Map.add(leyendaPanel);

// Imprime los resultados en la consola
print('Valores de concentración de NO2 de cada clase:');
print('Baja concentración de NO2:', imagenClasificada.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: districtBoundary,
  scale: 1000
}).get('clasificacion'));
print('Concentración moderada de NO2:', imagenClasificada.reduceRegion({
  reducer: ee.Reducer.median(),
  geometry: districtBoundary,
  scale: 1000
}).get('clasificacion'));
print('Alta concentración de NO2:', imagenClasificada.reduceRegion({
  reducer: ee.Reducer.mode(),
  geometry: districtBoundary,
  scale: 1000
}).get('clasificacion'));
print('Máxima concentración de NO2:', imagenClasificada.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: districtBoundary,
  scale: 1000
}).get('clasificacion'));


/* ------------------------------------------------------------------
            FIN DEL SCRIP
*/ // --------------------------------------------------------------