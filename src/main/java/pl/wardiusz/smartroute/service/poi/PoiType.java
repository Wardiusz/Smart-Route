package pl.wardiusz.smartroute.service.poi;

import pl.wardiusz.smartroute.enums.Interest;

import java.util.List;

public record PoiType(String qid, String label, Interest category, int visitMinutes) {

    public static final List<PoiType> ALL = List.of(
            new PoiType("Q23413", "zamek", Interest.HISTORY, 75),
            new PoiType("Q17715832", "ruiny zamku", Interest.HISTORY, 45),
            new PoiType("Q16560", "pałac", Interest.HISTORY, 60),
            new PoiType("Q751876", "château", Interest.HISTORY, 60),
            new PoiType("Q1802963", "rezydencja", Interest.HISTORY, 40),
            new PoiType("Q879050", "dwór", Interest.HISTORY, 40),
            new PoiType("Q44613", "klasztor", Interest.HISTORY, 45),
            new PoiType("Q160742", "opactwo", Interest.HISTORY, 45),
            new PoiType("Q2977", "katedra", Interest.HISTORY, 30),
            new PoiType("Q120560", "bazylika mniejsza", Interest.HISTORY, 30),
            new PoiType("Q34627", "synagoga", Interest.HISTORY, 30),
            new PoiType("Q57821", "fortyfikacja", Interest.HISTORY, 45),
            new PoiType("Q1785071", "fort", Interest.HISTORY, 45),
            new PoiType("Q839954", "stanowisko archeologiczne", Interest.HISTORY, 45),
            new PoiType("Q543654", "ratusz", Interest.HISTORY, 30),
            new PoiType("Q15243209", "zabytkowa dzielnica", Interest.HISTORY, 60),
            new PoiType("Q5773747", "zabytkowy dom", Interest.HISTORY, 30),
            new PoiType("Q33506", "muzeum", Interest.CULTURE, 75),
            new PoiType("Q207694", "muzeum sztuki", Interest.CULTURE, 75),
            new PoiType("Q588140", "muzeum nauki", Interest.CULTURE, 90),
            new PoiType("Q179700", "posąg", Interest.CULTURE, 15),
            new PoiType("Q4989906", "pomnik", Interest.CULTURE, 15),
            new PoiType("Q575759", "pomnik wojenny", Interest.CULTURE, 20),
            new PoiType("Q570116", "atrakcja turystyczna", Interest.CULTURE, 45),
            new PoiType("Q46169", "park narodowy", Interest.NATURE, 120),
            new PoiType("Q179049", "rezerwat przyrody", Interest.NATURE, 60),
            new PoiType("Q35509", "jaskinia", Interest.NATURE, 60),
            new PoiType("Q34038", "wodospad", Interest.NATURE, 30),
            new PoiType("Q23397", "jezioro", Interest.NATURE, 45),
            new PoiType("Q167346", "ogród botaniczny", Interest.NATURE, 60),
            new PoiType("Q22698", "park", Interest.NATURE, 45),
            new PoiType("Q1107656", "ogród", Interest.NATURE, 45),
            new PoiType("Q1440300", "wieża widokowa", Interest.VIEWPOINTS, 30),
            new PoiType("Q8502", "góra", Interest.VIEWPOINTS, 90),
            new PoiType("Q131734", "browar", Interest.FOOD, 60),
            new PoiType("Q156362", "winnica", Interest.FOOD, 60),
            new PoiType("Q43501", "zoo", Interest.ACTIVE, 120),
            new PoiType("Q194195", "park rozrywki", Interest.ACTIVE, 180));
}
