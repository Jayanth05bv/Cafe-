import java.sql.*;
public class DbCheck {
  public static void main(String[] args) throws Exception {
    try (Connection c = DriverManager.getConnection("jdbc:h2:file:./cafedb", "sa", "")) {
      query(c, "SELECT ID, NAME, ADDRESS, PHONE FROM CAFE ORDER BY ID");
      query(c, "SELECT ID, USERNAME, EMAIL, CAFE_ID, OWNER_ASSIGNMENT_ACCEPTED FROM USERS ORDER BY ID");
      query(c, "SELECT CAFE_ID, COUNT(*) AS TABLE_COUNT FROM CAFE_TABLE GROUP BY CAFE_ID ORDER BY CAFE_ID");
      query(c, "SELECT CAFE_ID, COUNT(*) AS MENU_COUNT FROM MENU GROUP BY CAFE_ID ORDER BY CAFE_ID");
      query(c, "SELECT USER_ID, OWNER_CAFES_ID FROM USER_OWNER_CAFES ORDER BY USER_ID, OWNER_CAFES_ID");
    }
  }
  static void query(Connection c, String sql) throws Exception {
    System.out.println("--- " + sql);
    try (Statement st = c.createStatement(); ResultSet rs = st.executeQuery(sql)) {
      ResultSetMetaData md = rs.getMetaData();
      int cols = md.getColumnCount();
      while (rs.next()) {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= cols; i++) {
          if (i > 1) sb.append(" | ");
          sb.append(md.getColumnLabel(i)).append("=").append(rs.getString(i));
        }
        System.out.println(sb);
      }
    }
  }
}
