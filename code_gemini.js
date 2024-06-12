/*-----------------------------------------------------------------------------------------
SCRIPT DESAROLLADO CON EL OBJETIVO DE COMPARAR LAS RESPUESTAS PRESENTADAS POR GEMINI, 
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


// Definir el ID de la colección Sentinel 5-P NO2
var no2Collection = ee.ImageCollection("COPERNICUS/S5P/NRTI/L3_NO2");

// Filtrar la colección por banda NO2
var no2Band = no2Collection.select("NO2_column_number_density");

// Definir el rango de fechas
var startDate = ee.Date('2024-04-01');
var endDate = ee.Date('2024-04-30');

// Filtrar la colección por fecha
var filteredCollection = no2Band.filterDate(startDate, endDate);

// Definir la paleta de colores
var no2Palette = ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red'];

// Obtener el límite administrativo del distrito Andres Ibañez
var goul = ee.FeatureCollection("FAO/GAUL/2015/level2")
var andresIbanez = goul.filter(ee.Filter.eq('ADM2_NAME', 'Andres Ibañez'));
//var andresIbanezPolygon = andresIbanez.geometry();

// Calcular la media de la colección filtrada
var meanNo2 = filteredCollection.mean();

// Recortar la imagen con el límite de Andres Ibañez
var maskedNo2 = meanNo2.clip(andresIbanez);

// Visualizar la imagen recortada con la paleta de colores definida
Map.addLayer(maskedNo2, {min: 0, max: 0.000054017134491809794, palette: no2Palette}, 'NO2 Andres Ibañez');

// Visualizar el límite de Andres Ibañez
Map.addLayer(andresIbanez, {}, 'Andres Ibañez');
Map.centerObject(andresIbanez, 9);

// INSTRUCCIÓN 2
/* ------------------------------------------------------------------------------------------
Continuando con su función como investigador de la calidad del aire, su próxima tarea es:

Obtener estadísticas de la imagen media recortada:
Del código anterior, seleccione nuevamente la banda utilizada y obtenga la media, mediana, moda, 
máximo y mínimo de NO2, e imprima todos los valores medios de Mean Composite en la consola.
*/ // ---------------------------------------------------------------------------------------


var meanReducer = ee.Reducer.mean();
var medianReducer = ee.Reducer.median();
var modeReducer = ee.Reducer.mode();
var minMaxReducer = ee.Reducer.minMax();

var mean = maskedNo2.reduceRegion({
  reducer: meanReducer,
  geometry: andresIbanez,
  scale: 1000
});

var median = maskedNo2.reduceRegion({
  reducer: medianReducer,
  geometry: andresIbanez,
  scale: 1000
});

var mode = maskedNo2.reduceRegion({
  reducer: modeReducer,
  geometry: andresIbanez,
  scale: 1000
});

var minMax = maskedNo2.reduceRegion({
  reducer: minMaxReducer,
  geometry: andresIbanez,
  scale: 1000
});

print('Mean:', mean);
print('Median:', median);
print('Mode:', mode);
print('Min_max:', minMax);



// INSTRUCCIÓN 3
/* ------------------------------------------------------------------------------------------
Continuando con su función como investigador de la calidad del aire, ahora realice la clasificación 
de la imagen recortada de NO2 en el mismo código:

Clasificación de la imagen recortada:
Basado en los valores estadísticos del compuesto medio de NO2, que es 0.00004421894532164106mol/m^2. 
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



// Define threshold values based on maximum and minimum
var max = 0.000054604486707766674;
var min = 0.000037137405657671605;

// Calculate the range between maximum and minimum
var range = max - min;

// Divide the range into four equal segments for four classes
var segmentWidth = range / 4;

// Define threshold values for each class
var lowThreshold = min;
var moderateLowThreshold = lowThreshold + segmentWidth;
var moderateHighThreshold = moderateLowThreshold + segmentWidth;
var highThreshold = moderateHighThreshold + segmentWidth;
var maxThreshold = max;

// Define class names
var classNames = ['Baja concentración de NO2', 'Concentración moderada baja de NO2', 'Concentración moderada alta de NO2', 'Alta concentración de NO2', 'Máxima concentración de NO2'];

// Classify the NO2 image using expression
var classifiedImage = maskedNo2.expression(
  "(b('NO2_column_number_density') <= lowThreshold) ? 0" +
  ": (b('NO2_column_number_density') <= moderateLowThreshold) ? 1" +
  ": (b('NO2_column_number_density') <= moderateHighThreshold) ? 2" +
  ": (b('NO2_column_number_density') <= highThreshold) ? 3" +
  ": 4",
  {
    lowThreshold: lowThreshold,
    moderateLowThreshold: moderateLowThreshold,
    moderateHighThreshold: moderateHighThreshold,
    highThreshold: highThreshold
  }
).rename('clasificacion');

// Define the palette for visualization
var palette = ['#0CCC20', 'orange', 'red', 'black'];

var classifiedImage1 = classifiedImage.clip(andresIbanez)

// Visualize the classified image on the map
Map.addLayer(classifiedImage1, {palette: palette}, 'NO2 clasificado');

// ... (previous code for classifying NO2 and defining classColors)

// Create a styled legend using UI elements
var legendPanel = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px'
  }
});

var legendTitle = ui.Label({
  value: 'NO2 con GEMINI',
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

legendPanel.add(legendTitle);


// Define legend items based on classColors and names
var legendItems = [];
var names = ['Concentración Baja', 'Concentración Moderada', 'Concentración Alta', 'Máxima Concentración'];
var classColors = ['green', 'orange', 'red', 'black'];
for (var i = 0; i < 4; i++) {
  var colorBox = ui.Label({
    style: {
      backgroundColor: classColors[i],
      padding: '8px',
      margin: '0 0 12px 0'
    }
  });

  var description = ui.Label({
    value: names[i],
    style: {
      margin: '0 0 4px 6px'
    }
  });

  legendItems.push(ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  }));
}

// Add legend items to the legend panel
for (var i = 0; i < legendItems.length; i++) {
  legendPanel.add(legendItems[i]);
}
legendPanel.add(legendTitle2);

// Add the legend panel to the map
Map.add(legendPanel);

print(classifiedImage)
