// Build: 2026-05-03T20:00 — full sync complete
// BUILD: 1777831251
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './pages/Layout';
import AtlasCore from './pages/AtlasCore';
import Biomes from './pages/Biomes';
import Constitution from './pages/Constitution';
import Corridors from './pages/Corridors';
import Cycles from './pages/Cycles';
import Field from './pages/Field';
import Habitats from './pages/Habitats';
import Home from './pages/Home';
import Journal from './pages/Journal';
import LogSighting from './pages/LogSighting';
import Map from './pages/Map';
import NearMe from './pages/NearMe';
import NightMode from './pages/NightMode';
import Search from './pages/Search';
import Seasonal from './pages/Seasonal';
import SeasonDetail from './pages/SeasonDetail';
import MonthDetail  from './pages/MonthDetail';
import Settings from './pages/Settings';
import Sky from './pages/Sky';
import Species from './pages/Species';
import SpeciesDetail from './pages/SpeciesDetail';
import Story from './pages/Story';
import TrailDetail from './pages/TrailDetail';
import HabitatDetail from './pages/HabitatDetail';
import Trails from './pages/Trails';
import WatershedStory from './pages/WatershedStory';
import Yearbook from './pages/Yearbook';
import Stewardship from './pages/Stewardship';
import ImageAudit from './pages/ImageAudit';
import CuratorReview from './pages/CuratorReview';
import TrailAudit from './pages/TrailAudit';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All routes nested inside Layout — persistent nav on every page */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />

          {/* Primary nav */}
          <Route path="home"            element={<Home />} />
          <Route path="species"         element={<Species />} />
          <Route path="species/:id"     element={<SpeciesDetail />} />
          <Route path="trails"          element={<Trails />} />
          <Route path="trails/:id"      element={<TrailDetail />} />
          <Route path="map"             element={<Map />} />
          <Route path="seasonal"        element={<Seasonal />} />
          <Route path="seasondetail"    element={<SeasonDetail />} />
          <Route path="monthdetail"     element={<MonthDetail />} />
          <Route path="nearme"          element={<NearMe />} />
          <Route path="journal"         element={<Journal />} />
          <Route path="logsighting"     element={<LogSighting />} />
          <Route path="search"          element={<Search />} />
          <Route path="settings"        element={<Settings />} />

          {/* Intelligence surfaces */}
          <Route path="sky"             element={<Sky />} />
          <Route path="Sky"             element={<Sky />} />
          <Route path="story"           element={<Story />} />
          <Route path="Story"           element={<Story />} />

          {/* Secondary / deep pages */}
          <Route path="corridors"       element={<Corridors />} />
          <Route path="Corridors"       element={<Corridors />} />
          <Route path="corridors/:id"     element={<Corridors />} />
          <Route path="Corridors/:id"     element={<Corridors />} />
          <Route path="biomes"          element={<Biomes />} />
          <Route path="Biomes"          element={<Biomes />} />
          <Route path="biomes/:id"        element={<Biomes />} />
          <Route path="Biomes/:id"        element={<Biomes />} />
          <Route path="habitats"        element={<Habitats />} />
          <Route path="Habitats"        element={<Habitats />} />
          <Route path="habitatdetail"   element={<HabitatDetail />} />
          <Route path="HabitatDetail"   element={<HabitatDetail />} />
          <Route path="cycles"          element={<Cycles />} />
          <Route path="Cycles"          element={<Cycles />} />
          <Route path="field"           element={<Field />} />
          <Route path="Field"           element={<Field />} />
          <Route path="yearbook"        element={<Yearbook />} />
          <Route path="Yearbook"        element={<Yearbook />} />
          <Route path="constitution"    element={<Constitution />} />
          <Route path="Constitution"    element={<Constitution />} />
          <Route path="watershed-story" element={<WatershedStory />} />
          <Route path="WatershedStory"  element={<WatershedStory />} />
          <Route path="core"            element={<AtlasCore />} />
          <Route path="AtlasCore"       element={<AtlasCore />} />
          <Route path="nightmode"       element={<NightMode />} />
          <Route path="NightMode"       element={<NightMode />} />

          {/* Curator / stewardship tools */}
          <Route path="stewardship"     element={<Stewardship />} />
          <Route path="Stewardship"     element={<Stewardship />} />
          <Route path="imageaudit"      element={<ImageAudit />} />
          <Route path="ImageAudit"      element={<ImageAudit />} />
          <Route path="curatorreview"   element={<CuratorReview />} />
          <Route path="CuratorReview"   element={<CuratorReview />} />
          <Route path="trailaudit"      element={<TrailAudit />} />
          <Route path="TrailAudit"      element={<TrailAudit />} />

          {/* Legacy capitalized aliases — backwards compat */}
          <Route path="Home"            element={<Navigate to="/home" replace />} />
          <Route path="Species"         element={<Navigate to="/species" replace />} />
          <Route path="SpeciesDetail"   element={<SpeciesDetail />} />
          <Route path="Trails"          element={<Navigate to="/trails" replace />} />
          <Route path="TrailDetail"     element={<TrailDetail />} />
          <Route path="Map"             element={<Navigate to="/map" replace />} />
          <Route path="Seasonal"        element={<Navigate to="/seasonal" replace />} />
          <Route path="SeasonDetail"    element={<Navigate to="/seasondetail" replace />} />
          <Route path="MonthDetail"     element={<Navigate to="/monthdetail" replace />} />
          <Route path="Journal"         element={<Navigate to="/journal" replace />} />
          <Route path="LogSighting"     element={<Navigate to="/logsighting" replace />} />
          <Route path="NearMe"          element={<Navigate to="/nearme" replace />} />
          <Route path="Search"          element={<Navigate to="/search" replace />} />
          <Route path="Settings"        element={<Navigate to="/settings" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App