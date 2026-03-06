async function fetchWithAuth(url, options = {}) {

    let access = localStorage.getItem("access_token");
    let refresh = localStorage.getItem("refresh_token");

    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            "Authorization": "Bearer " + access,
            "Content-Type": "application/json"
        }
    });

    if (response.status === 401) {

        const refreshRes = await fetch(
            "http://127.0.0.1:8000/api/auth/token/refresh/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    refresh: refresh
                })
            }
        );

        if (refreshRes.ok) {

            const data = await refreshRes.json();

            localStorage.setItem("access_token", data.access);

            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    "Authorization": "Bearer " + data.access,
                    "Content-Type": "application/json"
                }
            });

        } else {

            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            window.location.href = "/login.html";

        }
    }

    return response;
}