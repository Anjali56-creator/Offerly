import { Link } from "react-router-dom";

function CategoryCard({ category, count }) {
  return (
    <Link to={"/category/" + category.slug} className="category-card" style={{ background: category.color }}>
      <h3 className="category-name">{category.name}</h3>
      <p className="category-desc">{category.description}</p>
      <p className="category-count">{count} saved</p>
    </Link>
  );
}

export default CategoryCard;
