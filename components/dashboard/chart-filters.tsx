'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { CalendarIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChartFiltersProps {
  onPeriodChange: (period: string) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onExport: () => void;
}

export function ChartFilters({
  onPeriodChange,
  onDateRangeChange,
  onExport
}: ChartFiltersProps) {
  const [date, setDate] = useState<DateRange | undefined>();

  const handlePeriodChange = (value: string) => {
    setDate(undefined);
    onPeriodChange(value);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDate(range);
    onDateRangeChange(range);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 rounded-lg border border-border/40 shadow-sm">
        <Select onValueChange={handlePeriodChange}>
          <SelectTrigger 
            className="w-[160px] h-9 bg-transparent border-0 hover:bg-accent transition-colors"
          >
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border/40" />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'h-9 px-3 bg-transparent hover:bg-accent transition-colors',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'dd/MM/yy', { locale: ptBR })} -{' '}
                    {format(date.to, 'dd/MM/yy', { locale: ptBR })}
                  </>
                ) : (
                  format(date.from, 'dd/MM/yy', { locale: ptBR })
                )
              ) : (
                <span>Escolher data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0" 
            align="start"
          >
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
              locale={ptBR}
              className="rounded-lg border shadow-lg"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button 
        variant="outline" 
        size="icon" 
        onClick={onExport}
        className="h-9 w-9 border-border/40 hover:border-border/60 transition-colors"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
