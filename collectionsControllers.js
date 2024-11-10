const pool = require('./database');
const captureError = require('./captureGraceErrors')

/**
  * @description Collection Module - Create a new collection based on user selection @userId from user
  * @method POST/createNewCollectionByUserSelection
  */
const createNewCollectionByUserSelection = async (req, res) => {
    try {
        const { user_id, name, description } = req.body; // Expecting userId and create payload from req body
        //console.log("body" + JSON.stringify(req.body))
        //Insert the new collection based on user selection by user interface
        const result = await pool.query('INSERT INTO collections (id,user_id, name, description, created_at) VALUES ($1, $2, $3,$4, NOW()) RETURNING *',
            [1, user_id, name, description]
        );
        if (result.rowCount > 0) {
            return res.status(201).json({ status: true, message: 'Successfully created a new collection', data: result.rows[0] });
        } else {
            return res.status(500).json({ status: false, message: 'Error: Failed creating a new collection' })
        }
    } catch (error) {
        console.log('Error at createNewCollectionByUserSelection Fail ---', error.message);

        let graceErrors = captureError.captureGraceErrorsInExecution(error);
        return res.status(graceErrors.statusCode).json({
            status: graceErrors.status,
            message: graceErrors.message
        });
    }
}

/**
  * @description Collection Module - Create a recommendation into the collectionRecommendations Service @userId , @collectionId and @recommendationId from user
  * @method POST/addRecommendationsToCollection
  */
const addRecommendationsToCollection = async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { recommendationId, userId } = req.body; // Expecting recommendationId and userId in request body    

        //console.log("collectionReq::" + collectionId)
        //check the collection belongs to the user by collection Id and user Id provided by user selection Interface
        const collectionResult = await pool.query('SELECT * FROM collections WHERE id = $1 AND user_id = $2', [collectionId, userId]);

        if (collectionResult.rows.length === 0) return res.status(404).json({ error: 'Collection not found or does not belong to the user' });

        //check the recommendation belongs to the user by recommendation Id and user Id 
        const recommendationResult = await pool.query('SELECT * FROM recommendations WHERE id = $1 AND user_id = $2', [recommendationId, userId]);

        if (recommendationResult.rows.length === 0) return res.status(403).json({ error: 'Recommendation does not belong to the user' });

        // Check if the recommendation is already in the collection
        const checkExistence = await pool.query('SELECT * FROM collection_recommendations WHERE collection_id = $1 AND recommendation_id = $2', [collectionId, recommendationId]);

        if (checkExistence.rows.length > 0) return res.status(409).json({ error: 'Recommendation already exists in the collection' });

        // If recommendation already not exists in the collection, then insert the recommendation into the collection
        let result = await pool.query('INSERT INTO collection_recommendations (collection_id, recommendation_id) VALUES ($1, $2) RETURNING*', [collectionId, recommendationId]);

        if (result.rowCount > 0) {
            return res.status(201).json({ status: true, message: 'Recommendation added to collection successfully', data: result.rows[0] });
        } else {
            return res.status(500).json({ status: false, message: 'Error: Failed to add recommendation to collection' })
        }
    } catch (error) {
        console.error("error at addRecommendationsToCollection::" + error.message);
        let graceErrors = captureError.captureGraceErrorsInExecution(error);
        return res.status(graceErrors.statusCode).json({
            status: graceErrors.status,
            message: graceErrors.message
        });
    }
}

/**
  * @description Collection Module - Removed recommendation from collection Service based @userId , @collectionId and @recommendationId from user
  * @method DELETE/removeRecommendationsFromcollection
  */
const removeRecommendationsFromcollection = async (req, res) => {
    try {
        const { collectionId, recommendationId } = req.params;
        const { userId } = req.body; // Expecting userId in request body

        //firstly check the collection belongs to the user by user id and collection id
        const collectionResult = await pool.query('SELECT * FROM collections WHERE id = $1 AND user_id = $2', [collectionId, userId]);

        if (collectionResult.rows.length === 0) return res.status(404).json({ error: 'Collection not found or does not belong to the user' });


        //check the recommendation belongs to the user by user id and recommendation id
        const recommendationResult = await pool.query('SELECT * FROM recommendations WHERE id = $1 AND user_id = $2', [recommendationId, userId]);

        if (recommendationResult.rows.length === 0) return res.status(403).json({ error: 'Recommendation does not belong to the user' });

        //check if the recommendation exists in the collection by collection and recommendation id as they were joining keys of tables collection and recommedation
        const checkExistence = await pool.query('SELECT * FROM collection_recommendations WHERE collection_id = $1 AND recommendation_id = $2', [collectionId, recommendationId]);

        if (checkExistence.rows.length === 0) return res.status(404).json({ error: 'Recommendation not found in the collection' });

        //remove the recommendation from the collection (only from collection_recommendations table) by collection id and recommendation id
        let result = await pool.query('DELETE FROM collection_recommendations WHERE collection_id = $1 AND recommendation_id = $2', [collectionId, recommendationId]);
        if (result.rowCount > 0) {
            return res.status(201).json({ status: true, message: 'Recommendation removed from collection successfully' });
        } else {
            return res.status(500).json({ status: false, message: 'Error: Failed to remove Recommendation from collection' })
        }
    } catch (error) {
        console.error("error at removeRecommendationsFromcollection::" + error.message + "\n" + "To Check Error at specified line::" + error);
        let graceErrors = captureError.captureGraceErrorsInExecution(error);
        return res.status(graceErrors.statusCode).json({
            status: graceErrors.status,
            message: graceErrors.message
        });
    }
}

/**
  * @description Collection Module - view collections and recommendation Service based @userId from user
  * @method GET/viewRecommendationsFromcollections
  */

const viewRecommendationsFromcollections = async (req, res) => {
    try {
        const { userId } = req.params;
        //Get all collections for the user by userId
        const collectionsResult = await pool.query('SELECT * FROM collections WHERE user_id = $1', [userId]);
        //console.log("CollectionResult::" + JSON.stringify(collectionsResult))

        if (collectionsResult.rows.length === 0) return res.status(404).json({ error: 'No collections found for this user' });

        //get all recommendations for each collection 
        const collectionsWithRecommendations = [];

        for (let collection of collectionsResult?.rows) {
            const recommendationsResult = await pool.query('SELECT * FROM recommendations WHERE id IN (SELECT recommendation_id FROM collection_recommendations WHERE collection_id = $1)',
                [collection.id]
            );
            if (recommendationsResult.rowCount > 0) {
                // Add the recommendations to the collection object
                collection.recommendations = recommendationsResult.rows;
                collectionsWithRecommendations.push(collection);
            }
        }
        console.log("collectionsWithRecommendationsLength::" + collectionsWithRecommendations.length)
        //Return collections and their associated recommendations
        if (collectionsWithRecommendations.length > 0) {
            return res.status(201).json({ status: true, message: 'Successfully fetched the collections and their associated recommendations', data: collectionsWithRecommendations });
        } else {
            return res.status(500).json({ status: false, message: 'Error: Failed to fetch recommendation from collections as per provided details please give correct userId' })
        }
    } catch (error) {
        console.error("error at viewRecommendationsFromcollections::" + error.message);
        let graceErrors = captureError.captureGraceErrorsInExecution(error);
        return res.status(graceErrors.statusCode).json({
            status: graceErrors.status,
            message: graceErrors.message
        });
    }
}

/**
  * @description Collection Module - delete collections and recommendation Service based @userId and @collectionId from user
  * @method DELETE/deletecollectionAndrecommendationsByUser
  */

const deletecollectionAndrecommendationsByUser = async (req, res) => {
    try {
        const { userId, collectionId } = req.params;
        let collectionDeleted;
        let collectionRecommendationDeleted;
        //Verify the collection belongs to the user
        const collectionResult = await pool.query('SELECT * FROM collections WHERE id = $1 AND user_id = $2', [collectionId, userId]);

        if (collectionResult.rows.length === 0) return res.status(404).json({ error: 'Collection not found or does not belong to the user' });

        //Delete from collection_recommendations to remove any links (dependent on tables so we have to delete this first)
        let delcollectionRecom = await pool.query('DELETE FROM collection_recommendations WHERE collection_id = $1', [collectionId]);
        collectionRecommendationDeleted = delcollectionRecom.rowCount > 0 ? true : false;

        if (delcollectionRecom.rowCount > 0) {
            //Delete the collection from collections table
            let delcollections = await pool.query('DELETE FROM collections WHERE id = $1 AND user_id = $2', [collectionId, userId]);
            collectionDeleted = collectionRecommendationDeleted && delcollections.rowCount > 0 ? true : false;
        }
        //check both flags in true state
        if (collectionRecommendationDeleted && collectionDeleted) {
            return res.status(201).json({ status: true, message: 'Collection deleted successfully' });
        } else {
            return res.status(500).json({ status: false, message: 'Error: Failed to delete collection' })
        }
    } catch (error) {
        console.error("error at deletecollectionAndrecommendationsByUser::" + error.message);
        let graceErrors = captureError.captureGraceErrorsInExecution(error);
        return res.status(graceErrors.statusCode).json({
            status: graceErrors.status,
            message: graceErrors.message
        });
    }
}

/**
  * @description Collection Module - view collections and recommendation Service based @userId from user in pagination format
  * @method GET/paginationViewAsPerUser
  */

const paginationViewAsPerUser = async (req, res) => {
    try {
        const { userId, collectionId } = req.params;
        const { page = 1, limit = 10 } = req.query;  // Default to page 1, limit 10

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;
        // check the collection belongs to the user
        const collectionResult = await pool.query('SELECT * FROM collections WHERE id = $1 AND user_id = $2', [collectionId, userId]);

        if (collectionResult.rows.length === 0) return res.status(404).json({ error: 'Collection not found or does not belong to the user' });

        // Get total count of recommendations in this collection for pagination metadata
        const countResult = await pool.query('SELECT COUNT(*) FROM collection_recommendations WHERE collection_id = $1', [collectionId]);
        const totalRecommendations = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalRecommendations / limitNum);

        // Fetch paginated recommendations
        //console.log("collectionId:" + collectionId + "\n" + "LIMIT: " + limitNum + "\n" + "offset:: " + offset)

        const recommendationsResult = await pool.query(`SELECT * FROM recommendations r JOIN collection_recommendations cr ON r.id = cr.recommendation_id
            WHERE cr.collection_id = $1 LIMIT $2 OFFSET $3`, [collectionId, limitNum, offset]);

        //Return paginated recommendations with data
        if (recommendationsResult.rowCount > 0) {
            return res.status(201).json({
                status: true,
                message: 'successfully created the pagination view',
                data: {
                    recommendations: recommendationsResult.rows,
                    pagination: {
                        totalRecommendations,
                        totalPages,
                        currentPage: pageNum,
                        limit: limitNum
                    }
                }
            });
        } else {
            return res.status(500).json({ status: false, message: 'Error: Something went wrong while viewing the pagination' })
        }

    } catch (error) {
        console.error("error at paginationViewAsPerUser::" + error.message);
        let graceErrors = captureError.captureGraceErrorsInExecution(error);
        return res.status(graceErrors.statusCode).json({
            status: graceErrors.status,
            message: graceErrors.message
        });
    }
}
module.exports = {
    createNewCollectionByUserSelection,
    addRecommendationsToCollection,
    removeRecommendationsFromcollection,
    viewRecommendationsFromcollections,
    deletecollectionAndrecommendationsByUser,
    paginationViewAsPerUser
}