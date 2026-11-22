Add-Type -AssemblyName System.Drawing

function Render-MeditraceIcon {
    param (
        [int]$Width,
        [int]$Height,
        [string]$OutputPath,
        [string]$Mode = "standard" # "standard", "round", "foreground"
    )

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $size = [Math]::Min($Width, $Height)
    $scale = $size / 512.0

    function Get-RoundedRectPath($rect, $radius) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $radius * 2
        $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
        $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
        $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
        $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
        $path.CloseFigure()
        return $path
    }

    $cx = $Width / 2.0
    $cy = $Height / 2.0

    # Draw Background (if not foreground-only)
    if ($Mode -ne "foreground") {
        $cTop = [System.Drawing.Color]::FromArgb(15, 118, 110)
        $cBottom = [System.Drawing.Color]::FromArgb(6, 182, 212)
        $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
            (New-Object System.Drawing.PointF 0, 0),
            (New-Object System.Drawing.PointF $Width, $Height),
            $cTop,
            $cBottom
        )

        if ($Mode -eq "round") {
            $pad = 12.0 * $scale
            $g.FillEllipse($bgBrush, $pad, $pad, ($size - 2*$pad), ($size - 2*$pad))
            $innerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(60, 255, 255, 255)), (2.5 * $scale)
            $g.DrawEllipse($innerPen, $pad, $pad, ($size - 2*$pad), ($size - 2*$pad))
        } else {
            # Squircle
            $pad = 18.0 * $scale
            $bgRect = New-Object System.Drawing.RectangleF $pad, $pad, ($size - 2 * $pad), ($size - 2 * $pad)
            $bgCorner = 100.0 * $scale
            $bgPath = Get-RoundedRectPath $bgRect $bgCorner
            $g.FillPath($bgBrush, $bgPath)

            $innerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(60, 255, 255, 255)), (2.5 * $scale)
            $g.DrawPath($innerPen, $bgPath)
        }
    }

    # Emblem scaling factor: if foreground mode (Android adaptive), scale down to ~62% for safety zone
    $emblemScale = if ($Mode -eq "foreground") { $scale * 0.65 } else { $scale }

    # 1. Base Medical Cross
    $crossW = 76.0 * $emblemScale
    $crossH = 240.0 * $emblemScale
    $crossCorner = 34.0 * $emblemScale
    $crossBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 255, 253))

    $vertRect = New-Object System.Drawing.RectangleF ($cx - $crossW/2), ($cy - $crossH/2), $crossW, $crossH
    $vertPath = Get-RoundedRectPath $vertRect $crossCorner
    $g.FillPath($crossBrush, $vertPath)

    $horizRect = New-Object System.Drawing.RectangleF ($cx - $crossH/2), ($cy - $crossW/2), $crossH, $crossW
    $horizPath = Get-RoundedRectPath $horizRect $crossCorner
    $g.FillPath($crossBrush, $horizPath)

    # 2. Angled Pharmaceutical Capsule
    $state = $g.Save()
    $g.TranslateTransform($cx, $cy)
    $g.RotateTransform(-38)

    $pillHalfW = 70.0 * $emblemScale
    $pillH = 56.0 * $emblemScale
    $pillRadius = $pillH / 2.0

    # Left Pill Half
    $leftPillPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $leftPillPath.AddArc(-$pillHalfW, -$pillRadius, $pillH, $pillH, 90, 180)
    $leftPillPath.AddLine((-$pillHalfW + $pillRadius), -$pillRadius, 0, -$pillRadius)
    $leftPillPath.AddLine(0, $pillRadius, (-$pillHalfW + $pillRadius), $pillRadius)
    $leftPillPath.CloseFigure()
    $leftPillBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(13, 148, 136))
    $g.FillPath($leftPillBrush, $leftPillPath)

    # Right Pill Half
    $rightPillPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $rightPillPath.AddLine(0, -$pillRadius, ($pillHalfW - $pillRadius), -$pillRadius)
    $rightPillPath.AddArc(($pillHalfW - $pillH), -$pillRadius, $pillH, $pillH, 270, 180)
    $rightPillPath.AddLine(($pillHalfW - $pillRadius), $pillRadius, 0, $pillRadius)
    $rightPillPath.CloseFigure()
    $rightPillBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16, 185, 129))
    $g.FillPath($rightPillBrush, $rightPillPath)

    # Pill Divider
    $divPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(235, 255, 255, 255)), (3.5 * $emblemScale)
    $g.DrawLine($divPen, 0, -$pillRadius, 0, $pillRadius)
    $g.Restore($state)

    # 3. ECG Pulse Line
    $pts = @(
        (New-Object System.Drawing.PointF ($cx - 130 * $emblemScale), ($cy + 18 * $emblemScale)),
        (New-Object System.Drawing.PointF ($cx - 60 * $emblemScale), ($cy + 18 * $emblemScale)),
        (New-Object System.Drawing.PointF ($cx - 28 * $emblemScale), ($cy - 52 * $emblemScale)),
        (New-Object System.Drawing.PointF ($cx + 4 * $emblemScale), ($cy + 68 * $emblemScale)),
        (New-Object System.Drawing.PointF ($cx + 36 * $emblemScale), ($cy - 30 * $emblemScale)),
        (New-Object System.Drawing.PointF ($cx + 64 * $emblemScale), ($cy + 18 * $emblemScale)),
        (New-Object System.Drawing.PointF ($cx + 130 * $emblemScale), ($cy + 18 * $emblemScale))
    )

    $traceBorderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(200, 15, 23, 42)), (12.0 * $emblemScale)
    $traceBorderPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $traceBorderPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $traceBorderPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawLines($traceBorderPen, $pts)

    $tracePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), (5.5 * $emblemScale)
    $tracePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $tracePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $tracePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawLines($tracePen, $pts)

    # 4. Tracking Nodes
    $nodeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16, 185, 129))
    $nodePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), (2.5 * $emblemScale)
    $r = 7.0 * $emblemScale

    $keyNodes = @(
        (New-Object System.Drawing.PointF ($cx - 28 * $emblemScale), ($cy - 52 * $emblemScale)),
        (New-Object System.Drawing.PointF ($cx + 4 * $emblemScale), ($cy + 68 * $emblemScale)),
        (New-Object System.Drawing.PointF ($cx + 36 * $emblemScale), ($cy - 30 * $emblemScale))
    )

    foreach ($kn in $keyNodes) {
        $g.FillEllipse($nodeBrush, ($kn.X - $r), ($kn.Y - $r), ($r * 2), ($r * 2))
        $g.DrawEllipse($nodePen, ($kn.X - $r), ($kn.Y - $r), ($r * 2), ($r * 2))
    }

    # Save
    $dir = [System.IO.Path]::GetDirectoryName($OutputPath)
    if (-not [System.IO.Directory]::Exists($dir)) {
        [System.IO.Directory]::CreateDirectory($dir) | Out-Null
    }
    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Rendered: $OutputPath ($Width x $Height, mode=$Mode)"
}

# 1. Main Assets
Render-MeditraceIcon -Width 1024 -Height 1024 -OutputPath "mobile/assets/icon.png" -Mode "standard"
Render-MeditraceIcon -Width 1024 -Height 1024 -OutputPath "mobile/assets/adaptive-icon.png" -Mode "foreground"
Render-MeditraceIcon -Width 512 -Height 512 -OutputPath "mobile/assets/splash-icon.png" -Mode "standard"

# 2. Web Assets
Render-MeditraceIcon -Width 512 -Height 512 -OutputPath "web/public/logo.png" -Mode "standard"
Render-MeditraceIcon -Width 64 -Height 64 -OutputPath "web/public/favicon.png" -Mode "standard"

# 3. Android Mipmaps
$mipmaps = @(
    @{ folder="mipmap-mdpi"; size=48; fgSize=108 },
    @{ folder="mipmap-hdpi"; size=72; fgSize=162 },
    @{ folder="mipmap-xhdpi"; size=96; fgSize=216 },
    @{ folder="mipmap-xxhdpi"; size=144; fgSize=324 },
    @{ folder="mipmap-xxxhdpi"; size=192; fgSize=432 }
)

$resDir = "mobile/android/app/src/main/res"

foreach ($m in $mipmaps) {
    $dir = Join-Path $resDir $m.folder

    # Remove any old webp files so our crisp pngs take precedence
    Remove-Item (Join-Path $dir "ic_launcher*.webp") -ErrorAction SilentlyContinue

    Render-MeditraceIcon -Width $m.size -Height $m.size -OutputPath (Join-Path $dir "ic_launcher.png") -Mode "standard"
    Render-MeditraceIcon -Width $m.size -Height $m.size -OutputPath (Join-Path $dir "ic_launcher_round.png") -Mode "round"
    Render-MeditraceIcon -Width $m.fgSize -Height $m.fgSize -OutputPath (Join-Path $dir "ic_launcher_foreground.png") -Mode "foreground"
}

Write-Output "All icons successfully generated!"
