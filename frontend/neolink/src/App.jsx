import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes, Link} from 'react-router-dom';
import Homepage from './pages/homepage.jsx';
import Login from './pages/login.jsx';
import { AuthContext } from './components/AuthContext.jsx';
import PersonalPage from './pages/personal_page.jsx';
import CreateItem from './pages/create_item.jsx';
import Items from './pages/items.jsx';
import ItemDetail from './pages/item_detail.jsx';
import EditItem from './pages/edit_item.jsx';
import MyItems from './pages/myitems.jsx';
import PrivacyPolicy from './pages/privacy_policy.jsx';

function App() {
  return (
      <Router>
        <Routes>
          <Route path='*' element={<Homepage />} /> 
          <Route path='/login' element={<Login />} /> 
          <Route path='/personal-page' element={<PersonalPage />} />
          <Route path="/create-item" element={<CreateItem />} />
          <Route path="/items" element={<Items />} />
          <Route path="/items/:documentId" element={<ItemDetail />} />
          <Route path="/items/:documentId/edit" element={<EditItem />} />
          <Route path="/my-items" element={<MyItems />} />
          <Route path="/privacy_policy" element={<PrivacyPolicy />} />
        </Routes>
      </Router>
  );
}

export default App;
