import { Link } from 'react-router-dom';
import { useCatalog } from '../lib/CatalogContext';

export function CategoriesPage() {
  const catalog = useCatalog();
  return (
    <><header className="page-heading"><h1>Categories</h1><p>Browse the Hacker News video collection by topic.</p></header>
      <div className="category-groups">{catalog.areas.map((area) => <section key={area.id}><h2>{area.name}</h2><div>{area.categories.map((category) => <Link key={category.id} to={`/topic/${category.id}`}>{category.name}</Link>)}</div></section>)}</div>
    </>
  );
}
