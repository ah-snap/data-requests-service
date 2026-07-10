import sql from "../db";

const VALID_STATUSES = [
    "Pending",
    "In Progress",
    "Complete",
    "Confirmed",
    "Invalid",
    "Declined",
] as const;

type RequestStatus = (typeof VALID_STATUSES)[number];

interface CreateRequestBody {
    type: string;
    data: string;
    requestor: string;
}

interface UpdateRequestBody {
    status: RequestStatus;
    notes?: string;
}

export async function handleRequests(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const segments = url.pathname.replace(/^\/+/, "").split("/");
    console.log("Request segments:", req.url, segments);
    console.log("Request method:", req);


    if (segments[0] !== "requests") {
        return Response.json({ error: "Not found" }, { status: 404 });
    }

    const id = segments[1] ?? null;

    if (req.method === "POST" && !id) return createRequest(req);
    if (req.method === "GET" && !id) return getRequests(req);
    if (req.method === "GET" && id) return getRequest(id);
    if (req.method === "PATCH" && id) return updateRequest(req, id);
    if (req.method === "DELETE" && id) return deleteRequest(id);

    return Response.json({ error: "Not found" }, { status: 404 });
}

async function createRequest(req: Request): Promise<Response> {
    console.log("Creating request with body:", req);

    let body: CreateRequestBody;
    try {
        body = await req.json() as CreateRequestBody;
    } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { type, data, requestor } = body;
    if (!type?.trim() || !data?.trim() || !requestor?.trim()) {
        return Response.json(
            { error: "type, data, and requestor are required" },
            { status: 400 }
        );
    }
    if (type === "Teams Trigger") {
        let truncatedData = data.replace("!request", "").trim();

        if (truncatedData.toLowerCase().startsWith("showroomdemolicenses")) {
            truncatedData = truncatedData.replace(/showroomdemolicenses/gi, "").trim();
        }

        const [request] = await sql`
            INSERT INTO requests (type, data, requestor)
            VALUES ('ShowroomDemoLicenses', ${truncatedData}, ${requestor.trim()})
            RETURNING *
        `;

        return Response.json({"id": request.id, "type": "ShowroomDemoLicenses", "Parameters": truncatedData}, { status: 201 });
    } else {
        const [request] = await sql`
            INSERT INTO requests (type, data, requestor)
            VALUES (${type.trim()}, ${data.trim()}, ${requestor.trim()})
            RETURNING *
        `;

        return Response.json(request, { status: 201 });
    }
}

async function getRequests(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const requestor = url.searchParams.get("requestor");
    const type = url.searchParams.get("type");

    const requests = await sql`
    SELECT * FROM requests
    WHERE TRUE
      ${status ? sql`AND status = ${status}::request_status` : sql``}
      ${requestor ? sql`AND requestor = ${requestor}` : sql``}
      ${type ? sql`AND type = ${type}` : sql``}
    ORDER BY created_at DESC
  `;

    return Response.json(requests);
}

async function getRequest(id: string): Promise<Response> {
    const [request] = await sql`
    SELECT * FROM requests WHERE id = ${id}
  `;

    if (!request) {
        return Response.json({ error: "Request not found" }, { status: 404 });
    }

    return Response.json(request);
}

async function updateRequest(req: Request, id: string): Promise<Response> {
    let body: UpdateRequestBody;
    try {
        body = await req.json() as UpdateRequestBody;
    } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { status, notes } = body;

    if (!status || !(VALID_STATUSES as readonly string[]).includes(status)) {
        return Response.json(
            { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
            { status: 400 }
        );
    }

    const [updated] = await sql`
    UPDATE requests
    SET
      status = ${status}::request_status
      ${notes !== undefined ? sql`, notes = ${notes}` : sql``}
    WHERE id = ${id}
    RETURNING *
  `;

    if (!updated) {
        return Response.json({ error: "Request not found" }, { status: 404 });
    }

    return Response.json(updated);
}

async function deleteRequest(id: string): Promise<Response> {
    const [deleted] = await sql`
    DELETE FROM requests WHERE id = ${id} RETURNING id
  `;

    if (!deleted) {
        return Response.json({ error: "Request not found" }, { status: 404 });
    }

    return new Response(null, { status: 204 });
}
