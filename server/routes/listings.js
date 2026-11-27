import express from "express";

export function createListingsRouter(store, requireAuth) {
  const router = express.Router();

  router.get("/", requireAuth, async (req, res, next) => {
    try {
      const listings = await store.listListings();
      return res.json({ listings });
    } catch (err) {
      return next(err);
    }
  });

  router.get("/:id", requireAuth, async (req, res, next) => {
    try {
      const listing = await store.getListingById(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      return res.json({ listing });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}
