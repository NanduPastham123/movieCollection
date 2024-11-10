const express = require('express');
const app = express.Router();
const controllers = require('./collectionsControllers');

// Create a new collection to collection
app.post('/createNewCollectionByUserSelection', controllers.createNewCollectionByUserSelection);

// Add a recommendation to collection
app.post('/:collectionId/addRecommendationsToCollection', controllers.addRecommendationsToCollection);

// Remove recommendation from collection
app.delete('/:collectionId/removeRecommendationsFromcollection/:recommendationId',controllers.removeRecommendationsFromcollection);


// View recommendations of a collection
app.get('/:userId/viewRecommendationsFromcollections', controllers.viewRecommendationsFromcollections);


// Delete a collection record from collection
app.delete('/:userId/deletecollectionAndrecommendationsByUser/:collectionId', controllers.deletecollectionAndrecommendationsByUser);


//Pagination to view the data as per screen resolution support
app.get('/:userId/paginationViewAsPerUser/:collectionId/recommendations', controllers.paginationViewAsPerUser);


module.exports = app;
