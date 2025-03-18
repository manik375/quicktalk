const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    const token = localStorage.getItem("userToken"); // Get token from localStorage
    if (!token) {
      throw new Error("No token found. User not authenticated.");
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Include JWT in Authorization header
      ...options.headers, // Allow overriding/adding more headers
    };

    const response = await fetch(url, {
      // Use browser's fetch API
      ...options,
      headers: headers,
    });

    return response; // Return the response object
  } catch (error) {
    console.error("Error making authenticated request:", error);
    throw error;
  }
};

export default makeAuthenticatedRequest; // If you put it in a separate file, export it
