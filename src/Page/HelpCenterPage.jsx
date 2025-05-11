import React, { useState, useEffect, useCallback } from "react";
import SearchBar from "../Component/SearchBar";
import CategoryNav from "../Component/CategoryNav";
import HelpItemList from "../Component/HelpItemList";
import ContactForm from "../Component/ContactForm";
import { fetchCategories, fetchHelpItems } from "../services/apiService";
import LoadingSpinner from "../Component/Common/LoadingSpinner";

function HelpCenterPage() {
  const [categories, setCategories] = useState([]); // Will hold the filtered list
  const [helpItems, setHelpItems] = useState([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(null); // null for "All Topics"
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(true); // Start true
  const [isLoadingItems, setIsLoadingItems] = useState(false); // Start false, true when fetching items
  const [error, setError] = useState(null);

  // Log state changes for debugging
  useEffect(() => {
    console.log("[HelpCenterPage] State Update:", {
      categoriesLength: categories.length,
      selectedCategorySlug,
      searchTerm,
      isLoadingCategories,
      isLoadingItems,
      error,
    });
  }, [
    categories,
    selectedCategorySlug,
    searchTerm,
    isLoadingCategories,
    isLoadingItems,
    error,
  ]);

  // Fetch Categories on Mount
  useEffect(() => {
    const loadCategories = async () => {
      console.log(
        "[HelpCenterPage] useEffect: Attempting to load categories..."
      );
      setIsLoadingCategories(true);
      setError(null); // Clear previous errors before fetching
      try {
        const fetchedCats = await fetchCategories();
        console.log(
          "[HelpCenterPage] Raw data from fetchCategories():",
          fetchedCats
        );

        if (Array.isArray(fetchedCats)) {
          const filteredCats = fetchedCats.filter(
            (cat) => cat.slug !== "account-billing" // Your filter logic
          );
          console.log(
            "[HelpCenterPage] Categories after filtering:",
            filteredCats
          );
          setCategories(filteredCats);
        } else {
          console.warn(
            "[HelpCenterPage] fetchCategories did not return an array! Received:",
            fetchedCats,
            "Setting categories to empty array."
          );
          setCategories([]);
          // Optionally set an error if an empty non-array is unexpected
          // setError("Failed to load categories: Invalid data format received.");
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Apologies, we couldn't load help categories.";
        console.error("[HelpCenterPage] Error during loadCategories:", err);
        setError(errorMessage);
        setCategories([]); // Ensure categories is empty on error
      } finally {
        setIsLoadingCategories(false);
        console.log(
          "[HelpCenterPage] loadCategories finished. isLoadingCategories:",
          false
        );
      }
    };
    loadCategories();
  }, []); // Empty dependency array means this runs once on mount

  // Fetch Help Items when category or search term changes
  const loadHelpItems = useCallback(async () => {
    // Do not fetch if categories are still loading or failed, unless no category is selected (initial load for all items)
    if (isLoadingCategories && selectedCategorySlug) {
      console.log(
        "[HelpCenterPage] loadHelpItems: Aborting fetch, categories still loading/failed and a slug is selected."
      );
      return;
    }
    if (error && selectedCategorySlug) {
      // If there was an error loading categories and a category is selected, don't try to load its items
      console.log(
        "[HelpCenterPage] loadHelpItems: Aborting fetch due to previous category load error and a slug is selected."
      );
      return;
    }

    console.log(
      `[HelpCenterPage] loadHelpItems called. Slug: '${selectedCategorySlug}', Term: '${searchTerm}'`
    );
    setIsLoadingItems(true);
    // Don't clear general error here if it came from category loading.
    // Only clear if we are about to successfully fetch items.
    // setError(null);
    try {
      const items = await fetchHelpItems(selectedCategorySlug, searchTerm);
      console.log("[HelpCenterPage] Raw data from fetchHelpItems():", items);
      setHelpItems(Array.isArray(items) ? items : []);
      if (Array.isArray(items)) {
        // If items are fetched successfully, clear any previous error
        setError(null);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Sorry, we couldn't retrieve help articles.";
      console.error("[HelpCenterPage] Error during loadHelpItems:", err);
      setError(errorMessage);
      setHelpItems([]);
    } finally {
      setIsLoadingItems(false);
      console.log(
        "[HelpCenterPage] loadHelpItems finished. isLoadingItems:",
        false
      );
    }
  }, [selectedCategorySlug, searchTerm, isLoadingCategories, error]); // Added isLoadingCategories and error to dependencies

  useEffect(() => {
    loadHelpItems();
  }, [loadHelpItems]); // This effect calls loadHelpItems when its identity changes

  const handleSearch = (term) => {
    console.log("[HelpCenterPage] handleSearch called with term:", term);
    setError(null); // Clear error on new user action
    setSearchTerm(term);
    setSelectedCategorySlug(null); // Reset category when searching globally
  };

  const handleSelectCategory = (slug) => {
    console.log(
      "[HelpCenterPage] handleSelectCategory called with slug:",
      slug
    );
    setError(null); // Clear error on new user action
    setSelectedCategorySlug(slug);
    setSearchTerm(""); // Reset search term when selecting a category
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-sky-100 min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <header className="text-center mb-10 md:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 mb-3">
            Help & Support Center
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Find answers to your questions, explore tutorials, and get the most
            out of YourPlatform.
          </p>
        </header>

        <div className="mb-8 md:mb-12">
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
          {/* CATEGORY NAVIGATION SECTION */}
          {
            isLoadingCategories ? (
              <div className="flex justify-center items-center py-10">
                <LoadingSpinner size="md" />
                <p className="ml-3 text-slate-500">Loading categories...</p>
              </div>
            ) : categories.length > 0 ? (
              <CategoryNav
                categories={categories} // Using the filtered 'categories' state
                selectedCategory={selectedCategorySlug}
                onSelectCategory={handleSelectCategory}
              />
            ) : !error ? (
              // This shows if categories finish loading, categories array is empty, AND no error was set during category load
              <p className="text-center text-slate-500 py-6">
                No help categories available at the moment.
              </p>
            ) : null /* If there was an error loading categories, the main error display below will handle it */
          }

          {/* Divider: Show only if categories were successfully loaded and displayed */}
          {!isLoadingCategories && categories.length > 0 && (
            <hr className="my-6 sm:my-8 border-slate-200" />
          )}

          {/* MAIN CONTENT AREA: Error Display, Loading Items, or Item List */}
          {error ? ( // Display a general error if 'error' state is set
            <div
              className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md shadow my-6"
              role="alert"
            >
              <p className="font-bold">Oops! Something went wrong.</p>
              <p>{error}</p>
            </div>
          ) : isLoadingItems ? ( // If no error, check if items are loading
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-lg font-medium text-slate-600">
                Fetching help articles...
              </p>
            </div>
          ) : (
            // If no error and not loading items, show the item list (which handles its own empty state)
            <HelpItemList items={helpItems} />
          )}
        </div>

        <div className="mt-12 md:mt-16">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}

export default HelpCenterPage;
