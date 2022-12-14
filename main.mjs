import chalk from "chalk";
import nodeNotifier from "node-notifier";

const URL = "https://www.inet.se/";
const SEARCH_TERM = "7900 xtx";
const INTERVAL = 60;
const IGNORED_KEYWORDS = ["vattenkyl"];

const { log } = console;

const fetchProducts = async (searchTerm) => {
  const url = `${URL}/api/autocomplete?q=${encodeURIComponent(searchTerm)}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.products;
};

const getAvailableProducts = (products) => {
  const availableProducts = products.filter((product) => {
    const hasPrice = typeof product?.price?.price !== "undefined";
    const isBlocked = product?.qty?.["00"]?.blocked;
    const includesIgnoredKeywords = IGNORED_KEYWORDS.some((keyword) =>
      product.sellingPoint.toLowerCase().includes(keyword.toLowerCase())
    );
    return hasPrice && !isBlocked && !includesIgnoredKeywords;
  });

  return availableProducts;
};

const notify = (availableProducts) => {
  availableProducts.forEach((product) => {
    log(
      chalk.yellowBright.bold(`
      ${product.name} is available for ${
        product?.price?.price || "unknown"
      } sek - ${product.purchaseStatus}
    `)
    );
  });

  nodeNotifier.notify({
    title: `${availableProducts.length} products available`,
    sound: true,
    open: `${URL}/hitta?q=${encodeURIComponent(SEARCH_TERM)}`,
    actions: "Open",
    message: availableProducts
      .map((product) => `${product.price.price}sek - ${product.name}`)
      .join("\n"),
  });
};

const main = async () => {
  log("Checking for products...");
  const products = await fetchProducts(SEARCH_TERM);

  const availableProducts = await getAvailableProducts(products);
  log(
    chalk.cyan(
      `Found ${products.length} products, ${availableProducts.length} available.`
    )
  );

  if (availableProducts.length > 0) {
    notify(availableProducts);
  }
};

(async () => {
  log(chalk.green("Starting product checker..."));
  await main();
  setInterval(main, INTERVAL * 1000);
})();
