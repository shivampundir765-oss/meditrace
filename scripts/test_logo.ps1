Add-Type -AssemblyName System.Drawing

function Create-MeditraceLogo {
    param (
        [int]$Size,
        [string]$OutputPath,
        [bool]$TransparentBg = $false
    )

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($TransparentBg) {
        $g.Clear([System.Drawing.Color]::Transparent)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $scale = $Size / 512.0

    # Helper: Create rounded rectangle path
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

    # 1. Background Squircle
    $pad = 24.0 * $scale
    $bgRect = New-Object System.Drawing.RectangleF $pad, $pad, ($Size - 2 * $pad), ($Size - 2 * $pad)
    $bgCorner = 110.0 * $scale
    $bgPath = Get-RoundedRectPath $bgRect $bgCorner

    # Background Gradient (Teal-700 to Cyan-500)
    $cTop = [System.Drawing.Color]::FromArgb(15, 118, 110)
    $cBottom = [System.Drawing.Color]::FromArgb(6, 182, 212)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
        (New-Object System.Drawing.PointF 0, 0),
        (New-Object System.Drawing.PointF $Size, $Size),
        $cTop,
        $cBottom
    )
    $g.FillPath($bgBrush, $bgPath)

    # Subtle inner border
    $innerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 255, 255, 255)), (3.0 * $scale)
    $g.DrawPath($innerPen, $bgPath)

    # 2. Medical Cross (Base in center)
    $cx = $Size / 2.0
    $cy = $Size / 2.0

    $crossW = 76.0 * $scale
    $crossH = 240.0 * $scale
    $crossCorner = 34.0 * $scale

    $crossBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 255, 253))
    
    # Vertical cross arm
    $vertRect = New-Object System.Drawing.RectangleF ($cx - $crossW/2), ($cy - $crossH/2), $crossW, $crossH
    $vertPath = Get-RoundedRectPath $vertRect $crossCorner
    $g.FillPath($crossBrush, $vertPath)

    # Horizontal cross arm
    $horizRect = New-Object System.Drawing.RectangleF ($cx - $crossH/2), ($cy - $crossW/2), $crossH, $crossW
    $horizPath = Get-RoundedRectPath $horizRect $crossCorner
    $g.FillPath($crossBrush, $horizPath)

    # 3. Pharmaceutical Capsule (Angled Pill)
    $state = $g.Save()
    $g.TranslateTransform($cx, $cy)
    $g.RotateTransform(-38)

    $pillHalfW = 70.0 * $scale
    $pillH = 56.0 * $scale
    $pillRadius = $pillH / 2.0

    # Left Pill Half (Deep Teal #0d9488)
    $leftPillPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $leftPillPath.AddArc(-$pillHalfW, -$pillRadius, $pillH, $pillH, 90, 180)
    $leftPillPath.AddLine((-$pillHalfW + $pillRadius), -$pillRadius, 0, -$pillRadius)
    $leftPillPath.AddLine(0, $pillRadius, (-$pillHalfW + $pillRadius), $pillRadius)
    $leftPillPath.CloseFigure()
    $leftPillBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(13, 148, 136))
    $g.FillPath($leftPillBrush, $leftPillPath)

    # Right Pill Half (Bright Cyan-Emerald #10b981 / #06b6d4)
    $rightPillPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $rightPillPath.AddLine(0, -$pillRadius, ($pillHalfW - $pillRadius), -$pillRadius)
    $rightPillPath.AddArc(($pillHalfW - $pillH), -$pillRadius, $pillH, $pillH, 270, 180)
    $rightPillPath.AddLine(($pillHalfW - $pillRadius), $pillRadius, 0, $pillRadius)
    $rightPillPath.CloseFigure()
    $rightPillBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16, 185, 129))
    $g.FillPath($rightPillBrush, $rightPillPath)

    # Pill Divider
    $divPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(230, 255, 255, 255)), (3.5 * $scale)
    $g.DrawLine($divPen, 0, -$pillRadius, 0, $pillRadius)

    $g.Restore($state)

    # 4. ECG Pulse Wave (Trace Line)
    # Coordinates relative to center
    $pts = @(
        (New-Object System.Drawing.PointF ($cx - 130 * $scale), ($cy + 18 * $scale)),
        (New-Object System.Drawing.PointF ($cx - 60 * $scale), ($cy + 18 * $scale)),
        (New-Object System.Drawing.PointF ($cx - 28 * $scale), ($cy - 52 * $scale)),
        (New-Object System.Drawing.PointF ($cx + 4 * $scale), ($cy + 68 * $scale)),
        (New-Object System.Drawing.PointF ($cx + 36 * $scale), ($cy - 30 * $scale)),
        (New-Object System.Drawing.PointF ($cx + 64 * $scale), ($cy + 18 * $scale)),
        (New-Object System.Drawing.PointF ($cx + 130 * $scale), ($cy + 18 * $scale))
    )

    # Shadow/Border line
    $traceBorderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(200, 15, 23, 42)), (12.0 * $scale)
    $traceBorderPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $traceBorderPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $traceBorderPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawLines($traceBorderPen, $pts)

    # Glowing Trace Line
    $tracePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 255)), (5.5 * $scale)
    $tracePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $tracePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $tracePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawLines($tracePen, $pts)

    # Tracking Nodes (glowing dots)
    $nodeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16, 185, 129))
    $nodePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), (2.5 * $scale)
    $r = 7.0 * $scale

    $keyNodes = @(
        (New-Object System.Drawing.PointF ($cx - 28 * $scale), ($cy - 52 * $scale)),
        (New-Object System.Drawing.PointF ($cx + 4 * $scale), ($cy + 68 * $scale)),
        (New-Object System.Drawing.PointF ($cx + 36 * $scale), ($cy - 30 * $scale))
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
    Write-Output "Generated: $OutputPath ($Size x $Size)"
}

Create-MeditraceLogo -Size 512 -OutputPath "mobile/assets/test_logo.png"
