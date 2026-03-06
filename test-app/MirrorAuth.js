class MirrorAuth {
    /** OAuth Server Details */
    #serverBaseURL = "http://localhost:3000"

    #authorizationURL = "/OAuth/authorize"
    #tokenURL = "/OAuth/tokenValidate"

    /** Other stuff */
    #clientId;
    #clientSecret;

    isConfigured() {
        if (!this.#clientId) throw new Error("Client Id is not configured");
        if (!this.#clientSecret) throw new Error("client Secret is not configured");
    }

    provider({ clientId, clientSecret }) {
        if (!clientId) throw new Error("Client Id is not provided");
        if (!clientSecret) throw new Error("client Secret is not provided");

        this.#clientId = clientId;
        this.#clientSecret = clientSecret;
    }

    generateAuthLink() {
        this.isConfigured();

        //How to generate Link?
        // baseURL + authorizationURL + ?clientId=abc
        const authLink = `${this.#serverBaseURL}${this.#authorizationURL}?clientId=${this.#clientId}`
        return authLink;
    }

    async validate(token) {
        if (!token) {
            throw new Error("Token not provided");
        }

        try {
            const response = await fetch(`${this.#serverBaseURL}${this.#tokenURL}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId: this.#clientId,
                    clientSecret: this.#clientSecret,
                    token: token
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            /** 
             * data : {
             *  success: true,
             *  userData: {
             *      .........
             *      ..........
             *  }
             * }
             * 
             */
            return data;
            
        } catch (error) {
            console.error("Token validation failed:", error.message);
            throw new Error(`Token validation failed: ${error.message}`);
        }
    }
}

export default MirrorAuth;