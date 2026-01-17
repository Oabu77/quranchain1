import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Helper function to create an ecosystem and return its ID
async function createEcosystem(ecosystemData: any) {
	const response = await SELF.fetch(`http://local.test/ecosystems`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(ecosystemData),
	});
	const body = await response.json<{
		success: boolean;
		result: { id: number };
	}>();
	return body.result.id;
}

describe("Ecosystem API Integration Tests", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
	});

	// Tests for GET /ecosystems
	describe("GET /ecosystems", () => {
		it("should get an empty list of ecosystems", async () => {
			const response = await SELF.fetch(`http://local.test/ecosystems`);
			const body = await response.json<{ success: boolean; result: any[] }>();

			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.result).toEqual([]);
		});

		it("should get a list with one ecosystem", async () => {
			await createEcosystem({
				name: "Test Ecosystem",
				slug: "test-ecosystem",
				description: "An ecosystem for testing",
				category: "validator",
				status: "active",
				created_at: "2025-01-01T00:00:00.000Z",
			});

			const response = await SELF.fetch(`http://local.test/ecosystems`);
			const body = await response.json<{ success: boolean; result: any[] }>();

			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.result.length).toBe(1);
			expect(body.result[0]).toEqual(
				expect.objectContaining({
					name: "Test Ecosystem",
					slug: "test-ecosystem",
				}),
			);
		});
	});

	// Tests for POST /ecosystems
	describe("POST /ecosystems", () => {
		it("should create a new ecosystem successfully", async () => {
			const ecosystemData = {
				name: "New Ecosystem",
				slug: "new-ecosystem",
				description: "A brand new ecosystem",
				category: "application",
				status: "active",
				created_at: "2025-12-31T23:59:59.000Z",
			};
			const response = await SELF.fetch(`http://local.test/ecosystems`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(ecosystemData),
			});

			const body = await response.json<{ success: boolean; result: any }>();

			expect(response.status).toBe(201);
			expect(body.success).toBe(true);
			expect(body.result).toEqual(
				expect.objectContaining({
					id: expect.any(Number),
					...ecosystemData,
				}),
			);
		});

		it("should return a 400 error for invalid input", async () => {
			const invalidEcosystemData = {
				// Missing required fields 'name', 'slug', etc.
				description: "This is an invalid ecosystem",
			};
			const response = await SELF.fetch(`http://local.test/ecosystems`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(invalidEcosystemData),
			});
			const body = await response.json();

			expect(response.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.errors).toBeInstanceOf(Array);
		});
	});

	// Tests for GET /ecosystems/{id}
	describe("GET /ecosystems/{id}", () => {
		it("should get a single ecosystem by its ID", async () => {
			const ecosystemData = {
				name: "Specific Ecosystem",
				slug: "specific-ecosystem",
				description: "An ecosystem to be fetched by ID",
				category: "node",
				status: "active",
				created_at: "2025-06-01T12:00:00.000Z",
			};
			const ecosystemId = await createEcosystem(ecosystemData);

			const response = await SELF.fetch(
				`http://local.test/ecosystems/${ecosystemId}`,
			);
			const body = await response.json<{ success: boolean; result: any }>();

			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.result).toEqual(
				expect.objectContaining({
					id: ecosystemId,
					...ecosystemData,
				}),
			);
		});

		it("should return a 404 error if ecosystem is not found", async () => {
			const nonExistentId = 9999;
			const response = await SELF.fetch(
				`http://local.test/ecosystems/${nonExistentId}`,
			);
			const body = await response.json();

			expect(response.status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.errors[0].message).toBe("Not Found");
		});
	});

	// Tests for PUT /ecosystems/{id}
	describe("PUT /ecosystems/{id}", () => {
		it("should update an ecosystem successfully", async () => {
			const ecosystemData = {
				name: "Ecosystem to Update",
				slug: "ecosystem-to-update",
				description: "This ecosystem will be updated",
				category: "community",
				status: "active",
				created_at: "2025-07-01T00:00:00.000Z",
			};
			const ecosystemId = await createEcosystem(ecosystemData);

			const updatedData = {
				name: "Updated Ecosystem",
				slug: "updated-ecosystem",
				description: "This ecosystem has been updated",
				category: "validator",
				status: "inactive",
				created_at: "2025-07-15T10:00:00.000Z",
			};

			const response = await SELF.fetch(
				`http://local.test/ecosystems/${ecosystemId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updatedData),
				},
			);
			const body = await response.json<{ success: boolean; result: any }>();

			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.result).toEqual(
				expect.objectContaining({
					id: ecosystemId,
					...updatedData,
				}),
			);
		});

		it("should return 404 when trying to update a non-existent ecosystem", async () => {
			const nonExistentId = 9999;
			const updatedData = {
				name: "Updated Ecosystem",
				slug: "updated-ecosystem",
				description: "This ecosystem has been updated",
				category: "validator",
				status: "inactive",
				created_at: "2025-07-15T10:00:00.000Z",
			};
			const response = await SELF.fetch(
				`http://local.test/ecosystems/${nonExistentId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updatedData),
				},
			);

			expect(response.status).toBe(404);
		});

		it("should return 400 for invalid update data", async () => {
			const ecosystemId = await createEcosystem({
				name: "Ecosystem",
				slug: "ecosystem",
				description: "...",
				category: "node",
				status: "active",
				created_at: "2025-01-01T00:00:00.000Z",
			});
			const invalidUpdateData = { name: "" }; // Invalid name
			const response = await SELF.fetch(
				`http://local.test/ecosystems/${ecosystemId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(invalidUpdateData),
				},
			);

			expect(response.status).toBe(400);
		});
	});

	// Tests for DELETE /ecosystems/{id}
	describe("DELETE /ecosystems/{id}", () => {
		it("should delete an ecosystem successfully", async () => {
			const ecosystemData = {
				name: "Ecosystem to Delete",
				slug: "ecosystem-to-delete",
				description: "This ecosystem will be deleted",
				category: "application",
				status: "active",
				created_at: "2025-08-01T00:00:00.000Z",
			};
			const ecosystemId = await createEcosystem(ecosystemData);

			const deleteResponse = await SELF.fetch(
				`http://local.test/ecosystems/${ecosystemId}`,
				{
					method: "DELETE",
				},
			);
			const deleteBody = await deleteResponse.json<{
				success: boolean;
				result: any;
			}>();

			expect(deleteResponse.status).toBe(200);
			expect(deleteBody.success).toBe(true);
			expect(deleteBody.result.id).toBe(ecosystemId);

			// Verify the ecosystem is actually deleted
			const getResponse = await SELF.fetch(
				`http://local.test/ecosystems/${ecosystemId}`,
			);
			expect(getResponse.status).toBe(404);
		});

		it("should return 404 when trying to delete a non-existent ecosystem", async () => {
			const nonExistentId = 9999;
			const response = await SELF.fetch(
				`http://local.test/ecosystems/${nonExistentId}`,
				{
					method: "DELETE",
				},
			);
			const body = await response.json();

			expect(response.status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.errors[0].message).toBe("Not Found");
		});
	});
});
