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
      <Router basename='/neolink'>
        <Routes>
          <Route basename={'/neolink'} path='*' element={<Homepage />} /> 
          <Route basename={'/neolink'} path='/login' element={<Login />} /> 
          <Route basename={'/neolink'} path='/personal-page' element={<PersonalPage />} />
          <Route basename={'/neolink'} path="/create-item" element={<CreateItem />} />
          <Route basename={'/neolink'} path="/items" element={<Items />} />
          <Route basename={'/neolink'} path="/items/:documentId" element={<ItemDetail />} />
          <Route basename={'/neolink'} path="/items/:documentId/edit" element={<EditItem />} />
          <Route basename={'/neolink'} path="/my-items" element={<MyItems />} />
          <Route basename={'/neolink'} path="/privacy_policy" element={<PrivacyPolicy />} />
        </Routes>
      </Router>
  );
}

export default App;
