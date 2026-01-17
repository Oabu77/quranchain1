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

		// Test for search functionality
		it("should search ecosystems by name", async () => {
			await createEcosystem({
				name: "Validator Network",
				slug: "validator-network",
				description: "Main validator network",
				category: "validator",
				status: "active",
			});
			await createEcosystem({
				name: "Application Platform",
				slug: "app-platform",
				description: "Application ecosystem",
				category: "application",
				status: "active",
			});

			const response = await SELF.fetch(
				`http://local.test/ecosystems?search=Validator`,
			);
			const body = await response.json<{ success: boolean; result: any[] }>();

			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.result.length).toBe(1);
			expect(body.result[0].name).toBe("Validator Network");
		});

		// Test for search across multiple fields
		it("should search ecosystems across multiple fields", async () => {
			await createEcosystem({
				name: "Node Network",
				slug: "node-network",
				description: "Infrastructure for nodes",
				category: "node",
				status: "active",
			});
			await createEcosystem({
				name: "Community Hub",
				slug: "community-hub",
				description: "Community ecosystem hub",
				category: "community",
				status: "active",
			});

			const response = await SELF.fetch(
				`http://local.test/ecosystems?search=infrastructure`,
			);
			const body = await response.json<{ success: boolean; result: any[] }>();

			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.result.length).toBe(1);
			expect(body.result[0].description).toContain("Infrastructure");
		});

		// Test for pagination
		it("should paginate ecosystems correctly", async () => {
			// Create multiple ecosystems
			for (let i = 1; i <= 5; i++) {
				await createEcosystem({
					name: `Ecosystem ${i}`,
					slug: `ecosystem-${i}`,
					description: `Description ${i}`,
					category: "validator",
					status: "active",
				});
			}

			// Get first page
			const page1Response = await SELF.fetch(
				`http://local.test/ecosystems?page=1&per_page=2`,
			);
			const page1Body = await page1Response.json<{
				success: boolean;
				result: any[];
			}>();

			expect(page1Response.status).toBe(200);
			expect(page1Body.success).toBe(true);
			expect(page1Body.result.length).toBe(2);

			// Get second page
			const page2Response = await SELF.fetch(
				`http://local.test/ecosystems?page=2&per_page=2`,
			);
			const page2Body = await page2Response.json<{
				success: boolean;
				result: any[];
			}>();

			expect(page2Response.status).toBe(200);
			expect(page2Body.success).toBe(true);
			expect(page2Body.result.length).toBe(2);

			// Ensure pages contain different results
			expect(page1Body.result[0].id).not.toBe(page2Body.result[0].id);
		});
	});

	// Tests for POST /ecosystems
	describe("POST /ecosystems", () => {
		it("should create a new ecosystem successfully without created_at", async () => {
			const ecosystemData = {
				name: "New Ecosystem",
				slug: "new-ecosystem",
				description: "A brand new ecosystem",
				category: "application",
				status: "active",
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
					created_at: expect.any(String), // Should be set automatically
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

		// Test for invalid category enum
		it("should return 400 for invalid category value", async () => {
			const invalidEcosystemData = {
				name: "Invalid Ecosystem",
				slug: "invalid-ecosystem",
				description: "Ecosystem with invalid category",
				category: "invalid_category",
				status: "active",
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

		// Test for invalid status enum
		it("should return 400 for invalid status value", async () => {
			const invalidEcosystemData = {
				name: "Invalid Ecosystem",
				slug: "invalid-ecosystem",
				description: "Ecosystem with invalid status",
				category: "validator",
				status: "unknown",
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

		// Test for empty string validation
		it("should return 400 for empty string fields", async () => {
			const invalidEcosystemData = {
				name: "",
				slug: "valid-slug",
				description: "Valid description",
				category: "validator",
				status: "active",
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
			};
			const ecosystemId = await createEcosystem(ecosystemData);

			const updatedData = {
				name: "Updated Ecosystem",
				slug: "updated-ecosystem",
				description: "This ecosystem has been updated",
				category: "validator",
				status: "inactive",
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

		// Test that created_at cannot be updated
		it("should not allow updating created_at field", async () => {
			const ecosystemData = {
				name: "Test Ecosystem",
				slug: "test-ecosystem",
				description: "Test",
				category: "validator",
				status: "active",
			};
			const ecosystemId = await createEcosystem(ecosystemData);

			// Get the original created_at
			const getResponse = await SELF.fetch(
				`http://local.test/ecosystems/${ecosystemId}`,
			);
			const getBody = await getResponse.json<{
				success: boolean;
				result: any;
			}>();
			const originalCreatedAt = getBody.result.created_at;

			// Try to update with a different created_at
			const updateData = {
				name: "Updated Name",
				slug: "test-ecosystem",
				description: "Test",
				category: "validator",
				status: "active",
				created_at: "2099-01-01T00:00:00.000Z", // This should be ignored
			};

			const updateResponse = await SELF.fetch(
				`http://local.test/ecosystems/${ecosystemId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updateData),
				},
			);
			const updateBody = await updateResponse.json<{
				success: boolean;
				result: any;
			}>();

			// created_at should remain the same
			expect(updateBody.result.created_at).toBe(originalCreatedAt);
		});

		// Test for invalid enum values in update
		it("should return 400 for invalid category in update", async () => {
			const ecosystemId = await createEcosystem({
				name: "Ecosystem",
				slug: "ecosystem",
				description: "Test",
				category: "validator",
				status: "active",
			});

			const invalidUpdateData = {
				name: "Updated Name",
				slug: "ecosystem",
				description: "Test",
				category: "invalid_category",
				status: "active",
			};

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
