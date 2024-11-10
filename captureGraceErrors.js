const captureGraceErrorsInExecution = (error) => {
    // 201 Created: For a successful collection creation.
    // 409 Conflict: When there is a unique constraint violation, such as an existing collection name.
    // 422 Unprocessable Entity: When there’s a foreign key violation, indicating an invalid user_id.
    // 400 Bad Request: For check constraint violations, indicating an invalid input format or value.
    // 500 Internal Server Error: For any other unexpected errors.

    // Handle specific PostgreSQL errors
    if (error.code === '23505') { // Unique constraint violation
        return {
            status: false,
            statusCode: 409,
            message: 'A collection with the same name already exists.(duplicate key value violates unique constraint)',
        };
    } else if (error.code === '23503') { // Foreign key violation
        return {
            status: false,
            statusCode: 422,
            message: 'Invalid user ID provided.',
        };
    } else if (error.code === '23514') { // Check constraint violation
        return {
            status: false,
            statusCode: 400,
            message: 'A provided value violates a constraint. Please check your input values.',
        };
    }

    // For any other unexpected errors
    return {
        status: false,
        statusCode: 500,
        message: 'An unexpected error occurred. Please try again later.',
    };

}
module.exports = {
    captureGraceErrorsInExecution
}