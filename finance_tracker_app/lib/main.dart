import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'dart:math';

// -----------------------------------------------------------------------------
// 1. Models
// -----------------------------------------------------------------------------

String generateUuid() {
  final Random random = Random();
  return List.generate(16, (i) => random.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
}

@HiveType(typeId: 0)
class Category extends HiveObject {
  @HiveField(0)
  final String id;
  @HiveField(1)
  String name;
  @HiveField(2)
  int colorValue;

  Category({required this.id, required this.name, required this.colorValue});

  Color get color => Color(colorValue);

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as String,
        name: json['name'] as String,
        colorValue: json['colorValue'] as int,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'colorValue': colorValue,
      };
}

@HiveType(typeId: 1)
class Expense extends HiveObject {
  @HiveField(0)
  final String id;
  @HiveField(1)
  String title;
  @HiveField(2)
  double amount;
  @HiveField(3)
  DateTime date;
  @HiveField(4)
  Category category;

  Expense({
    required this.id,
    required this.title,
    required this.amount,
    required this.date,
    required this.category,
  });

  factory Expense.fromJson(Map<String, dynamic> json) => Expense(
        id: json['id'] as String,
        title: json['title'] as String,
        amount: (json['amount'] as num).toDouble(),
        date: DateTime.parse(json['date'] as String),
        category: Category.fromJson(json['category'] as Map<String, dynamic>),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'amount': amount,
        'date': date.toIso8601String(),
        'category': category.toJson(),
      };
}

// -----------------------------------------------------------------------------
// 2. Adapters for Hive
// -----------------------------------------------------------------------------

class CategoryAdapter extends TypeAdapter<Category> {
  @override
  final int typeId = 0;

  @override
  Category read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Category(
      id: fields[0] as String,
      name: fields[1] as String,
      colorValue: fields[2] as int,
    );
  }

  @override
  void write(BinaryWriter writer, Category obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.colorValue);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CategoryAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ExpenseAdapter extends TypeAdapter<Expense> {
  @override
  final int typeId = 1;

  @override
  Expense read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Expense(
      id: fields[0] as String,
      title: fields[1] as String,
      amount: fields[2] as double,
      date: fields[3] as DateTime,
      category: fields[4] as Category,
    );
  }

  @override
  void write(BinaryWriter writer, Expense obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.title)
      ..writeByte(2)
      ..write(obj.amount)
      ..writeByte(3)
      ..write(obj.date)
      ..writeByte(4)
      ..write(obj.category);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ExpenseAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// -----------------------------------------------------------------------------
// 3. Providers (State Management)
// -----------------------------------------------------------------------------

class ThemeProvider with ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.dark;
  final String _themeKey = 'themeMode';
  late Box<int> _settingsBox;

  ThemeProvider() {
    _initTheme();
  }

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  Future<void> _initTheme() async {
    _settingsBox = await Hive.openBox<int>('settings');
    final storedTheme = _settingsBox.get(_themeKey);
    if (storedTheme != null) {
      _themeMode = ThemeMode.values[storedTheme];
    }
    notifyListeners();
  }

  void toggleTheme(bool isDark) {
    _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    _settingsBox.put(_themeKey, _themeMode.index);
    notifyListeners();
  }
}

class CategoryProvider with ChangeNotifier {
  late Box<Category> _categoryBox;
  List<Category> _categories = [];

  List<Color> defaultColors = [
    Colors.red.shade400,
    Colors.blue.shade400,
    Colors.green.shade400,
    Colors.orange.shade400,
    Colors.purple.shade400,
    Colors.teal.shade400,
    Colors.pink.shade400,
    Colors.indigo.shade400,
  ];

  CategoryProvider() {
    _initCategories();
  }

  List<Category> get categories => _categories;

  Future<void> _initCategories() async {
    _categoryBox = await Hive.openBox<Category>('categories');
    if (_categoryBox.isEmpty) {
      _addDefaultCategories();
    } else {
      _categories = _categoryBox.values.toList();
    }
    notifyListeners();
  }

  void _addDefaultCategories() {
    final defaultCategoryNames = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];
    for (int i = 0; i < defaultCategoryNames.length; i++) {
      final category = Category(
        id: generateUuid(),
        name: defaultCategoryNames[i],
        colorValue: defaultColors[i % defaultColors.length].value,
      );
      _categoryBox.put(category.id, category);
      _categories.add(category);
    }
  }

  Category? getCategoryById(String id) {
    return _categoryBox.get(id);
  }

  void addCategory(Category category) {
    _categoryBox.put(category.id, category);
    _categories.add(category);
    notifyListeners();
  }

  void updateCategory(Category category) {
    _categoryBox.put(category.id, category);
    _categories = _categoryBox.values.toList();
    notifyListeners();
  }

  void deleteCategory(String id) {
    _categoryBox.delete(id);
    _categories.removeWhere((cat) => cat.id == id);
    notifyListeners();
  }
}

class ExpenseProvider with ChangeNotifier {
  late Box<Expense> _expenseBox;
  List<Expense> _expenses = [];

  ExpenseProvider() {
    _initExpenses();
  }

  List<Expense> get expenses => _expenses;

  double get totalExpenses {
    return _expenses.fold(0.0, (sum, item) => sum + item.amount);
  }

  Future<void> _initExpenses() async {
    _expenseBox = await Hive.openBox<Expense>('expenses');
    _expenses = _expenseBox.values.toList()
      ..sort((a, b) => b.date.compareTo(a.date));
    notifyListeners();
  }

  void addExpense(Expense expense) {
    _expenseBox.put(expense.id, expense);
    _expenses.add(expense);
    _expenses.sort((a, b) => b.date.compareTo(a.date));
    notifyListeners();
  }

  void updateExpense(Expense expense) {
    _expenseBox.put(expense.id, expense);
    _expenses = _expenseBox.values.toList()
      ..sort((a, b) => b.date.compareTo(a.date));
    notifyListeners();
  }

  void deleteExpense(String id) {
    _expenseBox.delete(id);
    _expenses.removeWhere((exp) => exp.id == id);
    notifyListeners();
  }

  List<Expense> getExpensesForPeriod(DateTime startDate, DateTime endDate) {
    return _expenses
        .where((exp) =>
            exp.date.isAfter(startDate.subtract(const Duration(days: 1))) &&
            exp.date.isBefore(endDate.add(const Duration(days: 1))))
        .toList();
  }

  Map<Category, double> getCategoryExpenses(List<Expense> expenses) {
    final Map<Category, double> categoryTotals = {};
    for (var expense in expenses) {
      categoryTotals.update(expense.category, (value) => value + expense.amount,
          ifAbsent: () => expense.amount);
    }
    return categoryTotals;
  }
}

// -----------------------------------------------------------------------------
// 4. Main App Setup
// -----------------------------------------------------------------------------

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();

  Hive.registerAdapter(CategoryAdapter());
  Hive.registerAdapter(ExpenseAdapter());

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => CategoryProvider()),
        ChangeNotifierProvider(create: (_) => ExpenseProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return MaterialApp(
          title: 'Finance Tracker',
          debugShowCheckedModeBanner: false,
          themeMode: themeProvider.themeMode,
          theme: ThemeData(
            useMaterial3: true,
            colorScheme: ColorScheme.fromSeed(
              seedColor: Colors.blue,
              brightness: Brightness.light,
            ),
            appBarTheme: const AppBarTheme(
              systemOverlayStyle: SystemUiOverlayStyle.dark,
            ),
          ),
          darkTheme: ThemeData(
            useMaterial3: true,
            colorScheme: ColorScheme.fromSeed(
              seedColor: Colors.blue,
              brightness: Brightness.dark,
            ),
            appBarTheme: const AppBarTheme(
              systemOverlayStyle: SystemUiOverlayStyle.light,
            ),
          ),
          home: const MainScreen(),
        );
      },
    );
  }
}

// -----------------------------------------------------------------------------
// 5. UI Widgets & Screens
// -----------------------------------------------------------------------------

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  static final List<Widget> _widgetOptions = <Widget>[
    const HomeScreen(),
    AddExpenseScreen(),
    const CategoriesScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _widgetOptions.elementAt(_selectedIndex),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _onItemTapped,
        destinations: const <NavigationDestination>[
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.add_circle_outline),
            selectedIcon: Icon(Icons.add_circle),
            label: 'Add Expense',
          ),
          NavigationDestination(
            icon: Icon(Icons.category_outlined),
            selectedIcon: Icon(Icons.category),
            label: 'Categories',
          ),
        ],
      ),
      floatingActionButton: _selectedIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () {
                setState(() {
                  _selectedIndex = 1;
                });
              },
              label: const Text('Add Expense'),
              icon: const Icon(Icons.add),
            )
          : null,
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  DateTime _selectedDate = DateTime.now();
  PeriodType _selectedPeriod = PeriodType.month;

  @override
  Widget build(BuildContext context) {
    final expenseProvider = Provider.of<ExpenseProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);

    DateTime startDate;
    DateTime endDate = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day, 23, 59, 59);

    switch (_selectedPeriod) {
      case PeriodType.day:
        startDate = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day);
        break;
      case PeriodType.week:
        startDate = _selectedDate.subtract(Duration(days: _selectedDate.weekday - 1));
        startDate = DateTime(startDate.year, startDate.month, startDate.day);
        break;
      case PeriodType.month:
        startDate = DateTime(_selectedDate.year, _selectedDate.month, 1);
        endDate = DateTime(_selectedDate.year, _selectedDate.month + 1, 0, 23, 59, 59);
        break;
      case PeriodType.year:
        startDate = DateTime(_selectedDate.year, 1, 1);
        endDate = DateTime(_selectedDate.year, 12, 31, 23, 59, 59);
        break;
    }

    final expensesInPeriod = expenseProvider.getExpensesForPeriod(startDate, endDate);
    final categoryTotals = expenseProvider.getCategoryExpenses(expensesInPeriod);
    final totalAmountInPeriod = expensesInPeriod.fold(0.0, (sum, exp) => sum + exp.amount);

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          title: const Text('Finance Tracker'),
          floating: true,
          pinned: true,
          actions: [
            IconButton(
              icon: Icon(themeProvider.isDarkMode ? Icons.dark_mode : Icons.light_mode),
              onPressed: () {
                themeProvider.toggleTheme(!themeProvider.isDarkMode);
              },
              tooltip: 'Toggle theme',
            ),
          ],
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPeriodSelector(context),
                const SizedBox(height: 16),
                _buildTotalExpensesCard(context, totalAmountInPeriod),
                const SizedBox(height: 16),
                if (expensesInPeriod.isEmpty)
                  _buildEmptyState(context)
                else ...[
                  Text(
                    'Expense Distribution',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  CategoryChart(categoryTotals: categoryTotals, totalAmount: totalAmountInPeriod),
                  const SizedBox(height: 24),
                  Text(
                    'Recent Expenses',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ],
              ],
            ),
          ),
        ),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final expense = expensesInPeriod[index];
              return ExpenseListItem(expense: expense);
            },
            childCount: expensesInPeriod.length,
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 80)),
      ],
    );
  }

  Widget _buildPeriodSelector(BuildContext context) {
    String formattedDateRange;
    switch (_selectedPeriod) {
      case PeriodType.day:
        formattedDateRange = DateFormat.yMMMd().format(_selectedDate);
        break;
      case PeriodType.week:
        final startOfWeek = _selectedDate.subtract(Duration(days: _selectedDate.weekday - 1));
        final endOfWeek = startOfWeek.add(const Duration(days: 6));
        formattedDateRange = '${DateFormat.yMMMd().format(startOfWeek)} - ${DateFormat.yMMMd().format(endOfWeek)}';
        break;
      case PeriodType.month:
        formattedDateRange = DateFormat.yMMMM().format(_selectedDate);
        break;
      case PeriodType.year:
        formattedDateRange = DateFormat.y().format(_selectedDate);
        break;
    }

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back_ios_new),
              onPressed: () {
                setState(() {
                  _selectedDate = _adjustDate(_selectedDate, _selectedPeriod, -1);
                });
              },
              tooltip: 'Previous period',
            ),
            Expanded(
              child: GestureDetector(
                onTap: () async {
                  final DateTime? pickedDate = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime(2000),
                    lastDate: DateTime(2101),
                  );
                  if (pickedDate != null && pickedDate != _selectedDate) {
                    setState(() {
                      _selectedDate = pickedDate;
                    });
                  }
                },
                child: Text(
                  formattedDateRange,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.arrow_forward_ios),
              onPressed: () {
                setState(() {
                  _selectedDate = _adjustDate(_selectedDate, _selectedPeriod, 1);
                });
              },
              tooltip: 'Next period',
            ),
            PopupMenuButton<PeriodType>(
              initialValue: _selectedPeriod,
              onSelected: (PeriodType result) {
                setState(() {
                  _selectedPeriod = result;
                });
              },
              itemBuilder: (BuildContext context) => <PopupMenuEntry<PeriodType>>[
                const PopupMenuItem<PeriodType>(value: PeriodType.day, child: Text('Day')),
                const PopupMenuItem<PeriodType>(value: PeriodType.week, child: Text('Week')),
                const PopupMenuItem<PeriodType>(value: PeriodType.month, child: Text('Month')),
                const PopupMenuItem<PeriodType>(value: PeriodType.year, child: Text('Year')),
              ],
              icon: const Icon(Icons.calendar_month),
              tooltip: 'Select period type',
            ),
          ],
        ),
      ),
    );
  }

  DateTime _adjustDate(DateTime date, PeriodType period, int direction) {
    if (period == PeriodType.day) {
      return date.add(Duration(days: direction));
    } else if (period == PeriodType.week) {
      return date.add(Duration(days: 7 * direction));
    } else if (period == PeriodType.month) {
      return DateTime(date.year, date.month + direction, date.day);
    } else {
      return DateTime(date.year + direction, date.month, date.day);
    }
  }

  Widget _buildTotalExpensesCard(BuildContext context, double totalAmount) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Total Expenses in Period',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              NumberFormat.currency(symbol: '\$', decimalDigits: 2).format(totalAmount),
              style: Theme.of(context).textTheme.displaySmall!.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 40),
        Icon(Icons.money_off, size: 80, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5)),
        const SizedBox(height: 16),
        Text(
          'No expenses recorded for this period.',
          style: Theme.of(context).textTheme.titleMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Tap the "Add Expense" button below to get started!',
          style: Theme.of(context).textTheme.bodyMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 80),
      ],
    );
  }
}

enum PeriodType { day, week, month, year }

class CategoryChart extends StatelessWidget {
  final Map<Category, double> categoryTotals;
  final double totalAmount;

  const CategoryChart({
    super.key,
    required this.categoryTotals,
    required this.totalAmount,
  });

  @override
  Widget build(BuildContext context) {
    if (categoryTotals.isEmpty || totalAmount == 0) {
      return Container(
        height: 200,
        alignment: Alignment.center,
        child: Text(
          'No expenses to display in chart.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      );
    }

    return SizedBox(
      height: 250,
      child: Card(
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Row(
            children: [
              Expanded(
                flex: 3,
                child: PieChart(
                  PieChartData(
                    sections: _buildChartSections(context),
                    borderData: FlBorderData(show: false),
                    sectionsSpace: 2,
                    centerSpaceRadius: 40,
                    pieTouchData: PieTouchData(enabled: false),
                  ),
                ),
              ),
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.only(left: 8.0),
                  child: ListView.builder(
                    itemCount: categoryTotals.length,
                    itemBuilder: (context, index) {
                      final category = categoryTotals.keys.elementAt(index);
                      final amount = categoryTotals.values.elementAt(index);
                      final percentage = totalAmount > 0 ? (amount / totalAmount * 100) : 0.0;
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Row(
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: category.color,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                category.name,
                                style: Theme.of(context).textTheme.bodySmall,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Text(
                              '${percentage.toStringAsFixed(1)}%',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<PieChartSectionData> _buildChartSections(BuildContext context) {
    return categoryTotals.entries.map((entry) {
      final category = entry.key;
      final amount = entry.value;
      final percentage = totalAmount > 0 ? (amount / totalAmount * 100) : 0.0;
      return PieChartSectionData(
        color: category.color,
        value: amount,
        title: '${percentage.toStringAsFixed(0)}%',
        radius: 50,
        titleStyle: Theme.of(context).textTheme.bodySmall!.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
        badgeWidget: percentage > 5
            ? null
            : Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: category.color.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  category.name,
                  style: Theme.of(context).textTheme.bodySmall!.copyWith(
                        color: Colors.white,
                        fontSize: 8,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
      );
    }).toList();
  }
}

class ExpenseListItem extends StatelessWidget {
  final Expense expense;

  const ExpenseListItem({super.key, required this.expense});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: expense.category.color.withOpacity(0.3),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.receipt_long, color: expense.category.color),
        ),
        title: Text(expense.title),
        subtitle: Text(
          '${expense.category.name} • ${DateFormat.yMMMd().format(expense.date)}',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        trailing: Text(
          NumberFormat.currency(symbol: '\$', decimalDigits: 2).format(expense.amount),
          style: Theme.of(context).textTheme.titleMedium!.copyWith(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
        ),
      ),
    );
  }
}

class AddExpenseScreen extends StatefulWidget {
  AddExpenseScreen({super.key});

  @override
  State<AddExpenseScreen> createState() => _AddExpenseScreenState();
}

class _AddExpenseScreenState extends State<AddExpenseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();
  Category? _selectedCategory;
  DateTime _selectedDate = DateTime.now();

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categoryProvider = Provider.of<CategoryProvider>(context);
    final expenseProvider = Provider.of<ExpenseProvider>(context);
    final categories = categoryProvider.categories;
    if (categories.isNotEmpty && _selectedCategory == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        setState(() {
          _selectedCategory = categories.first;
        });
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Expense'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  border: OutlineInputBorder(),
                  hintText: 'e.g. Groceries',
                ),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter a title' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(
                  labelText: 'Amount (\$)',
                  border: OutlineInputBorder(),
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Enter amount';
                  if (double.tryParse(v) == null || double.parse(v) <= 0) return 'Enter a valid amount';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<Category>(
                value: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'Category',
                  border: OutlineInputBorder(),
                ),
                items: categories
                    .map((c) => DropdownMenuItem<Category>(
                          value: c,
                          child: Row(
                            children: [
                              Container(
                                width: 16,
                                height: 16,
                                decoration: BoxDecoration(
                                  color: c.color,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(c.name),
                            ],
                          ),
                        ))
                    .toList(),
                onChanged: (c) => setState(() => _selectedCategory = c),
              ),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('Date'),
                subtitle: Text(DateFormat.yMMMd().format(_selectedDate)),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final d = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime(2000),
                    lastDate: DateTime.now(),
                  );
                  if (d != null) setState(() => _selectedDate = d);
                },
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () {
                  if (!_formKey.currentState!.validate() || _selectedCategory == null) return;
                  final expense = Expense(
                    id: generateUuid(),
                    title: _titleController.text.trim(),
                    amount: double.parse(_amountController.text.trim()),
                    date: _selectedDate,
                    category: _selectedCategory!,
                  );
                  expenseProvider.addExpense(expense);
                  _titleController.clear();
                  _amountController.clear();
                  setState(() => _selectedDate = DateTime.now());
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Expense added')),
                  );
                },
                icon: const Icon(Icons.add),
                label: const Text('Add Expense'),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CategoriesScreen extends StatelessWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final categoryProvider = Provider.of<CategoryProvider>(context);
    final categories = categoryProvider.categories;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expense Categories'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: category.color.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.category, color: category.color),
              ),
              title: Text(category.name),
            ),
          );
        },
      ),
    );
  }
}
