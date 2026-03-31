import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../providers/expense_provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/category_chart.dart';
import '../widgets/expense_list_item.dart';

enum PeriodType { day, week, month, year }

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
    DateTime endDate = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
      23,
      59,
      59,
    );

    switch (_selectedPeriod) {
      case PeriodType.day:
        startDate = DateTime(
          _selectedDate.year,
          _selectedDate.month,
          _selectedDate.day,
        );
        break;
      case PeriodType.week:
        startDate =
            _selectedDate.subtract(Duration(days: _selectedDate.weekday - 1));
        startDate = DateTime(startDate.year, startDate.month, startDate.day);
        break;
      case PeriodType.month:
        startDate = DateTime(_selectedDate.year, _selectedDate.month, 1);
        endDate = DateTime(
          _selectedDate.year,
          _selectedDate.month + 1,
          0,
          23,
          59,
          59,
        );
        break;
      case PeriodType.year:
        startDate = DateTime(_selectedDate.year, 1, 1);
        endDate = DateTime(_selectedDate.year, 12, 31, 23, 59, 59);
        break;
    }

    final expensesInPeriod =
        expenseProvider.getExpensesForPeriod(startDate, endDate);
    final categoryTotals =
        expenseProvider.getCategoryExpenses(expensesInPeriod);
    final totalAmountInPeriod =
        expensesInPeriod.fold(0.0, (sum, exp) => sum + exp.amount);

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          title: const Text('Finance Tracker'),
          floating: true,
          pinned: true,
          actions: [
            IconButton(
              icon: Icon(
                themeProvider.isDarkMode
                    ? Icons.dark_mode
                    : Icons.light_mode,
              ),
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
                  CategoryChart(
                    categoryTotals: categoryTotals,
                    totalAmount: totalAmountInPeriod,
                  ),
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
              return ExpenseListItem(
                expense: expense,
                onEdit: () => _showEditExpenseSheet(context, expense),
                onDelete: () =>
                    _confirmAndDeleteExpense(context, expense),
              );
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
        final startOfWeek =
            _selectedDate.subtract(Duration(days: _selectedDate.weekday - 1));
        final endOfWeek = startOfWeek.add(const Duration(days: 6));
        formattedDateRange =
            '${DateFormat.yMMMd().format(startOfWeek)} - ${DateFormat.yMMMd().format(endOfWeek)}';
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
                  _selectedDate =
                      _adjustDate(_selectedDate, _selectedPeriod, -1);
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
                  _selectedDate =
                      _adjustDate(_selectedDate, _selectedPeriod, 1);
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
              itemBuilder: (BuildContext context) =>
                  <PopupMenuEntry<PeriodType>>[
                const PopupMenuItem<PeriodType>(
                  value: PeriodType.day,
                  child: Text('Day'),
                ),
                const PopupMenuItem<PeriodType>(
                  value: PeriodType.week,
                  child: Text('Week'),
                ),
                const PopupMenuItem<PeriodType>(
                  value: PeriodType.month,
                  child: Text('Month'),
                ),
                const PopupMenuItem<PeriodType>(
                  value: PeriodType.year,
                  child: Text('Year'),
                ),
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
              NumberFormat.currency(symbol: '\$', decimalDigits: 2)
                  .format(totalAmount),
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
        Icon(
          Icons.money_off,
          size: 80,
          color:
              Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
        ),
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

  Future<void> _showEditExpenseSheet(
      BuildContext context, dynamic expense) async {
    final titleController = TextEditingController(text: expense.title);
    final amountController =
        TextEditingController(text: expense.amount.toString());
    DateTime selectedDate = expense.date;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Edit Expense',
                style: Theme.of(ctx).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amountController,
                decoration: const InputDecoration(
                  labelText: 'Amount (\$)',
                  border: OutlineInputBorder(),
                ),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Date'),
                subtitle: Text(DateFormat.yMMMd().format(selectedDate)),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final d = await showDatePicker(
                    context: ctx,
                    initialDate: selectedDate,
                    firstDate: DateTime(2000),
                    lastDate: DateTime.now(),
                  );
                  if (d != null) {
                    selectedDate = d;
                  }
                },
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () {
                  final title = titleController.text.trim();
                  final amount = double.tryParse(
                        amountController.text.trim(),
                      ) ??
                      0;
                  if (title.isEmpty || amount <= 0) {
                    Navigator.of(ctx).pop();
                    return;
                  }
                  final expenseProvider =
                      Provider.of<ExpenseProvider>(context, listen: false);
                  expenseProvider.updateExpense(
                    expense
                      ..title = title
                      ..amount = amount
                      ..date = selectedDate,
                  );
                  Navigator.of(ctx).pop();
                },
                child: const Text('Save'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _confirmAndDeleteExpense(BuildContext context, dynamic expense) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Delete expense?'),
          content: const Text(
              'This will permanently remove the expense.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
    if (confirmed == true) {
      final provider =
          Provider.of<ExpenseProvider>(context, listen: false);
      provider.deleteExpense(expense.id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Expense deleted')),
      );
    }
  }
}

